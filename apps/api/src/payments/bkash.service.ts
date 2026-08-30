import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentGatewayConfigsService } from 'src/payment-gateways/payment-gateway-configs.service';

export interface BkashCreatePaymentResult {
  paymentUrl: string;
  paymentID: string;
}

export interface BkashExecutePaymentResult {
  transactionStatus: string;
  trxID: string;
  amount: string;
  paymentID: string;
}

export interface BkashAgreementResult {
  paymentID: string;
  bkashURL: string;
}

export interface BkashExecuteAgreementResult {
  agreementId: string;
  transactionStatus: string;
  trxID: string;
}

export interface BkashChargeWithAgreementResult {
  paymentID: string;
  bkashURL: string;
}

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);

  // In-memory id_token cache. bKash tokens are valid ~1hr; refreshed 5 min
  // early to avoid using a token that expires mid-request.
  private cachedToken: { idToken: string; expiresAt: number } | null = null;

  constructor(private readonly gatewayConfigs: PaymentGatewayConfigsService) {}

  /**
   * Resolve credentials from Admin → Settings → Payments at call time — no
   * .env or code changes needed to configure or rotate bKash credentials.
   */
  private async getConfig() {
    const c = await this.gatewayConfigs.getDecryptedCredentials('bkash');

    const username = c.username?.trim() || '';
    const password = c.password?.trim() || '';
    const appKey = c.appKey?.trim() || '';
    const appSecret = c.appSecret?.trim() || '';
    const grantUrl = c.grantTokenUrl?.trim() || '';
    const createUrl = c.createPaymentUrl?.trim() || '';
    const executeUrl = c.executePaymentUrl?.trim() || '';

    if (!username || !password || !appKey || !appSecret || !grantUrl || !createUrl || !executeUrl) {
      this.logger.warn('bKash credentials not fully configured in Admin → Settings → Payments — payments will fail');
    }

    return { username, password, appKey, appSecret, grantUrl, createUrl, executeUrl };
  }

  private async getIdToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 5 * 60_000) {
      return this.cachedToken.idToken;
    }

    const cfg = await this.getConfig();

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.grantUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          username: cfg.username,
          password: cfg.password,
        },
        body: JSON.stringify({ app_key: cfg.appKey, app_secret: cfg.appSecret }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash grant-token API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    if (!json.id_token) {
      this.logger.warn(`bKash grant-token failed: ${JSON.stringify(json)}`);
      throw new BadRequestException(json.msg ?? 'bKash authentication failed');
    }

    this.cachedToken = {
      idToken: json.id_token,
      expiresAt: Date.now() + Number(json.expires_in ?? 3600) * 1000,
    };
    return json.id_token;
  }

  /**
   * Create a bKash Tokenized Checkout payment. Returns `paymentUrl` (bKash's
   * `bkashURL`) to redirect the customer to, and `paymentID` for the later
   * execute (capture) step.
   */
  async createPayment(params: {
    invoiceNumber: string;
    amount: number;
    callbackUrl: string;
    payerReference?: string;
  }): Promise<BkashCreatePaymentResult> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Initiating bKash payment for invoice ${params.invoiceNumber} — ৳${params.amount}`);

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: params.payerReference ?? params.invoiceNumber,
          callbackURL: params.callbackUrl,
          amount: params.amount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: params.invoiceNumber,
        }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash create-payment API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    if (!json.paymentID || !json.bkashURL) {
      this.logger.warn(`bKash create-payment failed: ${JSON.stringify(json)}`);
      throw new BadRequestException(json.statusMessage ?? json.msg ?? 'Payment initiation failed');
    }

    return { paymentUrl: json.bkashURL, paymentID: json.paymentID };
  }

  /**
   * Execute (capture) a bKash payment after the customer completes it on
   * bKash's hosted page and is redirected back to our callback with
   * `status=success`. This is the actual charge-confirmation step.
   */
  async executePayment(paymentID: string): Promise<BkashExecutePaymentResult> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Executing bKash payment ${paymentID}`);

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.executeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({ paymentID }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash execute-payment API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    this.logger.log(`bKash execute response: ${JSON.stringify(json)}`);

    return {
      transactionStatus: json.transactionStatus ?? '',
      trxID: json.trxID ?? '',
      amount: json.amount ?? '',
      paymentID: json.paymentID ?? paymentID,
    };
  }

  generateInvoiceNumber(orderId: number): string {
    return `BK-${orderId}-${Date.now()}`;
  }

  generateLeadInvoiceNumber(leadId: number): string {
    return `BKLEAD-${leadId}-${Date.now()}`;
  }

  generateLiveInvoiceNumber(enrollmentId: number): string {
    return `BKLCE-${enrollmentId}-${Date.now()}`;
  }

  generateShopInvoiceNumber(orderId: number): string {
    return `BKSHOP-${orderId}-${Date.now()}`;
  }

  generateLiveSubscriptionInvoiceNumber(subscriptionId: number): string {
    return `BKLCS-${subscriptionId}-${Date.now()}`;
  }

  /**
   * Create a bKash agreement for recurring payments. Uses mode '0000'.
   * Returns `bkashURL` to redirect the customer to for wallet verification.
   */
  async createAgreement(params: {
    invoiceNumber: string;
    amount: number;
    callbackUrl: string;
    payerReference?: string;
  }): Promise<BkashAgreementResult> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Creating bKash agreement for invoice ${params.invoiceNumber}`);

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({
          mode: '0000',
          payerReference: params.payerReference ?? params.invoiceNumber,
          callbackURL: params.callbackUrl,
          amount: params.amount.toFixed(2),
          currency: 'BDT',
          intent: 'Sale',
          merchantInvoiceNumber: params.invoiceNumber,
        }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash create-agreement API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    if (!json.paymentID || !json.bkashURL) {
      this.logger.warn(`bKash create-agreement failed: ${JSON.stringify(json)}`);
      throw new BadRequestException(json.statusMessage ?? json.msg ?? 'Agreement creation failed');
    }

    return { paymentID: json.paymentID, bkashURL: json.bkashURL };
  }

  /**
   * Execute a bKash agreement after the customer completes wallet verification.
   * Returns the `agreementId` to store for future recurring charges.
   */
  async executeAgreement(paymentID: string): Promise<BkashExecuteAgreementResult> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Executing bKash agreement ${paymentID}`);

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.executeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({ paymentID }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash execute-agreement API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    this.logger.log(`bKash execute-agreement response: ${JSON.stringify(json)}`);

    return {
      agreementId: json.agreementID ?? '',
      transactionStatus: json.transactionStatus ?? '',
      trxID: json.trxID ?? '',
    };
  }

  /**
   * Charge a customer's bKash wallet using a stored agreement. Uses mode '0011'
   * with the agreementID. This is called by the billing cron for recurring charges.
   */
  async chargeWithAgreement(params: {
    agreementId: string;
    amount: number;
    invoiceNumber: string;
    callbackUrl: string;
  }): Promise<BkashChargeWithAgreementResult> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Charging bKash agreement ${params.agreementId} — ৳${params.amount}`);

    let json: Record<string, any>;
    try {
      const res = await fetch(cfg.createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({
          mode: '0011',
          agreementID: params.agreementId,
          callbackURL: params.callbackUrl,
          amount: params.amount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: params.invoiceNumber,
        }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('bKash charge-with-agreement API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    if (!json.paymentID || !json.bkashURL) {
      this.logger.warn(`bKash charge-with-agreement failed: ${JSON.stringify(json)}`);
      throw new BadRequestException(json.statusMessage ?? json.msg ?? 'Recurring charge failed');
    }

    return { paymentID: json.paymentID, bkashURL: json.bkashURL };
  }

  /**
   * Cancel a bKash agreement to prevent future recurring charges.
   */
  async cancelAgreement(agreementId: string): Promise<void> {
    const cfg = await this.getConfig();
    const idToken = await this.getIdToken();

    this.logger.log(`Cancelling bKash agreement ${agreementId}`);

    try {
      const cancelUrl = cfg.createUrl.replace('/create', '/cancel');
      const res = await fetch(cancelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': cfg.appKey,
        },
        body: JSON.stringify({ agreementID: agreementId }),
      });
      const json = await res.json();
      this.logger.log(`bKash cancel-agreement response: ${JSON.stringify(json)}`);
    } catch (err) {
      this.logger.error('bKash cancel-agreement API unreachable', err);
      // Don't throw — cancellation is best-effort; subscription will expire anyway
    }
  }
}
