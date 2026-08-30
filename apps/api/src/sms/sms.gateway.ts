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
      this.logger.error(`SMS to ${phone} failed: ${result.error}`);
      if (throwOnError) {
        throw new InternalServerErrorException(`SMS failed: ${result.error}`);
      }
      return false;
    }
    return true;
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
      if (result.ok) sent += batch.length;
      else {
        failed += batch.length;
        this.logger.error(`Bulk SMS batch failed: ${result.error}`);
      }
    }
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
  ): Promise<{ ok: boolean; error?: string }> {
    const creds = await this.storageConfig.getDecryptedCredentials('bulksms');
    const apiKey = creds.apiKey?.trim() || this.config.get<string>('BULKSMSBD_API_KEY');
    const senderId = creds.senderId?.trim() || this.config.get<string>('BULKSMSBD_SENDER_ID', 'Skillkoro');

    if (!apiKey) {
      this.logger.warn('BULKSMSBD_API_KEY not set — SMS not sent (dev mode)');
      this.logger.debug(`[SMS DEV] To: ${number} | Message: ${message}`);
      return { ok: true };
    }

    const normalized = this.normalizePhone(number);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${normalized}&senderid=${senderId}&message=${encodeURIComponent(message)}`;

    let responseText = '';
    try {
      const res = await fetch(url);
      responseText = await res.text();
    } catch (err) {
      this.logger.error('SMS gateway network error', err as Error);
      return { ok: false, error: 'SMS gateway unreachable. Please try again.' };
    }

    let responseCode: number;
    try {
      const parsed = JSON.parse(responseText);
      responseCode = parsed?.response_code ?? parsed;
    } catch {
      responseCode = parseInt(responseText.trim(), 10);
    }

    this.logger.log(`BulkSMSBD response: ${responseText.trim()}`);

    if (responseCode === 202) return { ok: true };

    return {
      ok: false,
      error:
        BULKSMSBD_ERRORS[responseCode] ??
        `BulkSMSBD error code ${responseCode}. Raw: ${responseText.trim()}`,
    };
  }
}
