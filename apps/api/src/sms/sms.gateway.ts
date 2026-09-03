import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageConfigService } from 'src/storage-config/storage-config.service';

const BULKSMSBD_ERRORS: Record<number, string> = {
  1001: 'Invalid phone number format.',
  1002: 'SMS Sender ID is incorrect or disabled.',
  1003: 'Missing required fields. Check API key and sender ID.',
  1005: 'BulkSMSBD internal error. Try again.',
  1006: 'SMS account balance validity expired.',
  1007: 'Insufficient SMS balance.',
  1011: 'BulkSMSBD user ID not found.',
  1012: 'Masking SMS must be sent in Bengali.',
  1013: 'Sender ID gateway not found for this API key.',
  1014: 'Sender type name not found for this API key.',
  1015: 'No valid gateway found for this Sender ID.',
  1016: 'Sender type active price info not found.',
  1017: 'Sender type price info not found.',
  1018: 'BulkSMSBD account owner is disabled.',
  1019: 'Sender type price is disabled for this account.',
  1020: 'Parent account not found.',
  1021: 'Parent active price not found.',
  1031: 'BulkSMSBD account not verified. Contact administrator.',
  1032: 'Your server IP is not whitelisted in BulkSMSBD.',
};

export type SmsDispatchResult = {
  ok: boolean;
  error?: string;
  messageId?: string;
  balance?: number;
  responseCode?: number;
  rawResponse?: string;
};

/**
 * Thin wrapper around the BulkSMSBD gateway. Centralises sending so the OTP
 * flow, templated event SMS, and broadcasts all share one implementation.
 *
 * In dev (no API key) it logs instead of sending, so the whole SMS system is
 * usable locally without a live gateway.
 */
@Injectable()
export class SmsGateway {
  private readonly logger = new Logger(SmsGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * Send one SMS. Returns true on success. When `throwOnError` is set (OTP),
   * a failure throws so the caller can surface it; otherwise it logs + returns
   * false (fire-and-forget for non-critical events).
   */
  async send(phone: string, message: string, throwOnError = false): Promise<boolean> {
    const result = await this.dispatch(phone, message);
    if (!result.ok) {
      this.logger.error(`SMS to ${phone} failed: ${result.error} (code=${result.responseCode})`);
      if (throwOnError) {
        throw new InternalServerErrorException(`SMS failed: ${result.error}`);
      }
      return false;
    }
    this.logger.log(`SMS to ${phone} accepted: messageId=${result.messageId ?? 'n/a'} balance=${result.balance ?? 'n/a'}`);
    return true;
  }

  /**
   * Send one SMS and return the full dispatch result (for broadcast tracking).
   */
  async sendWithResult(phone: string, message: string): Promise<SmsDispatchResult> {
    return this.dispatch(phone, message);
  }

  /**
   * Send the same message to many numbers. BulkSMSBD accepts a comma-separated
   * list on the smsapi endpoint; we chunk to stay within request limits.
   */
  async sendBulk(
    numbers: string[],
    message: string,
  ): Promise<{ sent: number; failed: number }> {
    const unique = Array.from(new Set(numbers.map((n) => this.normalizePhone(n.trim())).filter(Boolean)));
    if (unique.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;
    const CHUNK = 50;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const batch = unique.slice(i, i + CHUNK);
      const result = await this.dispatch(batch.join(','), message);
      if (result.ok) {
        sent += batch.length;
        this.logger.log(`Bulk SMS batch ${Math.floor(i / CHUNK) + 1}: ${batch.length} sent, balance=${result.balance ?? 'n/a'}`);
      } else {
        failed += batch.length;
        this.logger.error(`Bulk SMS batch ${Math.floor(i / CHUNK) + 1} failed: ${result.error} (code=${result.responseCode})`);
      }
    }
    this.logger.log(`Bulk SMS complete: ${sent} sent, ${failed} failed out of ${unique.length} total`);
    return { sent, failed };
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  /** Normalise a Bangladeshi phone number to the 8801XXXXXXXXX format BulkSMSBD expects. */
  private normalizePhone(raw: string): string {
    let p = raw.replace(/[\s\-()]/g, '');
    if (p.startsWith('+880')) p = p.slice(1);
    else if (p.startsWith('880')) { /* already ok */ }
    else if (p.startsWith('0')) p = '880' + p.slice(1);
    return p;
  }

  private async dispatch(
    number: string,
    message: string,
  ): Promise<SmsDispatchResult> {
    const creds = await this.storageConfig.getDecryptedCredentials('bulksms');
    const apiKey = creds.apiKey?.trim() || this.config.get<string>('BULKSMSBD_API_KEY');
    const senderId = creds.senderId?.trim() || this.config.get<string>('BULKSMSBD_SENDER_ID', 'Skillkoro');

    if (!apiKey) {
      this.logger.warn('BULKSMSBD_API_KEY not set — SMS not sent (dev mode)');
      this.logger.debug(`[SMS DEV] To: ${number} | Message: ${message}`);
      return { ok: true, responseCode: 202, rawResponse: 'dev-mode' };
    }

    const normalized = this.normalizePhone(number);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${normalized}&senderid=${senderId}&message=${encodeURIComponent(message)}`;

    this.logger.log(`BulkSMSBD request: POST ${url.replace(apiKey, '***')}`);

    let responseText = '';
    let httpStatus = 0;
    try {
      const res = await fetch(url);
      httpStatus = res.status;
      responseText = await res.text();
      this.logger.log(`BulkSMSBD HTTP ${httpStatus}: ${responseText.trim()}`);
    } catch (err) {
      this.logger.error(`BulkSMSBD network error: ${(err as Error).message}`, err as Error);
      return { ok: false, error: 'SMS gateway unreachable. Please try again.', rawResponse: responseText };
    }

    // Handle non-2xx HTTP status
    if (httpStatus < 200 || httpStatus >= 300) {
      const errorMsg = `SMS gateway returned HTTP ${httpStatus}`;
      this.logger.error(`${errorMsg}: ${responseText.trim()}`);
      return { ok: false, error: errorMsg, rawResponse: responseText, responseCode: httpStatus };
    }

    // Parse JSON response
    let parsed: Record<string, unknown> = {};
    let responseCode: number;
    try {
      parsed = JSON.parse(responseText);
      responseCode = typeof parsed.response_code === 'number' ? parsed.response_code : parseInt(String(parsed.response_code ?? responseText.trim()), 10);
    } catch {
      responseCode = parseInt(responseText.trim(), 10);
    }

    const messageId = typeof parsed.message_id === 'string' ? parsed.message_id : undefined;
    const balance = typeof parsed.balance === 'number' ? parsed.balance : undefined;
    const success = typeof parsed.success === 'boolean' ? parsed.success : responseCode === 202;

    this.logger.log(
      `BulkSMSBD result: code=${responseCode} success=${success} ` +
      `messageId=${messageId ?? 'n/a'} balance=${balance ?? 'n/a'} ` +
      `raw=${responseText.trim().substring(0, 500)}`,
    );

    if (success || responseCode === 202) {
      return { ok: true, responseCode, messageId, balance, rawResponse: responseText };
    }

    const knownError = BULKSMSBD_ERRORS[responseCode];
    const errorMsg = knownError
      ? `BulkSMSBD error ${responseCode}: ${knownError}`
      : `BulkSMSBD error code ${responseCode}. Raw: ${responseText.trim().substring(0, 300)}`;

    this.logger.error(`SMS dispatch failed: ${errorMsg}`);
    return { ok: false, error: errorMsg, responseCode, messageId, balance, rawResponse: responseText };
  }
}
