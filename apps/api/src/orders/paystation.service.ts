import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentGatewayConfigsService } from 'src/payment-gateways/payment-gateway-configs.service';

export interface PaystationInitResult {
  paymentUrl: string;
  invoiceNumber: string;
  paymentAmount: string;
}

export interface PaystationTrxData {
  invoice_number: string;
  trx_status: 'processing' | 'success' | 'successful' | 'failed' | 'refund';
  trx_id: string;
  payment_amount: string;
  order_date_time: string;
  payer_mobile_no: string;
  payment_method: string;
  reference: string;
  checkout_items: string;
}

export interface PaystationTrxResponse {
  status_code: string;
  status: string;
  message: string;
  data?: PaystationTrxData;
}

@Injectable()
export class PaystationService {
  private readonly logger = new Logger(PaystationService.name);

  // Fallback base URL if the admin hasn't set one in Admin → Settings →
  // Payments yet (see PAYMENT_GATEWAY_DEFS 'baseUrl' field).
  private static readonly DEFAULT_LIVE_URL = 'https://api.paystation.com.bd';

  constructor(private readonly gatewayConfigs: PaymentGatewayConfigsService) {}

  /**
   * Resolve gateway credentials + base URL at call time so changes made in
   * Admin → Settings → Payments take effect immediately, with no .env or
   * code changes.
   */
  private async getConfig(): Promise<{
    merchantId: string;
    password: string;
    baseUrl: string;
  }> {
    const c = await this.gatewayConfigs.getDecryptedCredentials('paystation');

    const merchantId = c.merchantId?.trim() || '';
    const password = c.password?.trim() || '';
    const baseUrl = c.baseUrl?.trim() || PaystationService.DEFAULT_LIVE_URL;

    if (!merchantId || !password) {
      this.logger.warn(
        'PayStation credentials not configured in Admin → Settings → Payments — payments will fail',
      );
    }

    return { merchantId, password, baseUrl };
  }

  /**
   * Initiate a PayStation hosted checkout.
   * Returns the `payment_url` to redirect the user to.
   */
  async initiatePayment(params: {
    invoiceNumber: string;
    amount: number;
    custName: string;
    custPhone: string;
    custEmail: string;
    callbackUrl: string;
    reference?: string;
    checkoutItems?: string;
  }): Promise<PaystationInitResult> {
    const { merchantId, password, baseUrl } = await this.getConfig();

    const body = new URLSearchParams({
      merchantId,
      password,
      invoice_number: params.invoiceNumber,
      currency:       'BDT',
      payment_amount: String(Math.round(params.amount)),
      cust_name:      params.custName,
      cust_phone:     params.custPhone,
      cust_email:     params.custEmail,
      callback_url:   params.callbackUrl,
      reference:      params.reference ?? '',
      checkout_items: params.checkoutItems ?? '',
    });

    this.logger.log(`Initiating PayStation payment for invoice ${params.invoiceNumber} — ৳${params.amount}`);

    let json: Record<string, string>;
    try {
      const res = await fetch(`${baseUrl}/initiate-payment`, {
        method: 'POST',
        body,
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('PayStation API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    if (json.status_code !== '200' || json.status !== 'success') {
      this.logger.warn(`PayStation initiation failed: ${json.message}`);
      throw new BadRequestException(json.message ?? 'Payment initiation failed');
    }

    return {
      paymentUrl:     json.payment_url,
      invoiceNumber:  json.invoice_number,
      paymentAmount:  json.payment_amount,
    };
  }

  /**
   * Verify a transaction by invoice number.
   * Used after the user returns from PayStation's hosted checkout.
   */
  async verifyByInvoice(invoiceNumber: string): Promise<PaystationTrxResponse> {
    this.logger.log(`Verifying PayStation transaction for invoice ${invoiceNumber}`);

    const { merchantId, password, baseUrl } = await this.getConfig();

    let json: PaystationTrxResponse;
    try {
      const res = await fetch(`${baseUrl}/transaction-status`, {
        method: 'POST',
        headers: {
          merchantId,
          password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_number: invoiceNumber }),
      });
      json = await res.json();
    } catch (err) {
      this.logger.error('PayStation verify API unreachable', err);
      throw new BadRequestException('Payment gateway unreachable. Please try again.');
    }

    this.logger.log(`PayStation verify response: ${JSON.stringify(json)}`);
    return json;
  }

  /**
   * Generate a unique invoice number for an order.
   * Format: PS-{orderId}-{timestamp}
   */
  generateInvoiceNumber(orderId: number): string {
    return `PS-${orderId}-${Date.now()}`;
  }

  /**
   * Generate a unique invoice number for a guest lead payment.
   * The `LEAD-` prefix is what the callback uses to dispatch to LeadsService
   * (vs PS- for regular orders and LCE- for live course enrollments).
   * Format: LEAD-{leadId}-{timestamp}
   */
  generateLeadInvoiceNumber(leadId: number): string {
    return `LEAD-${leadId}-${Date.now()}`;
  }
}
