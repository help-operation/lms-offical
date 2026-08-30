// Code-defined credential schema per payment gateway. The admin UI renders
// its Payment Settings page purely from this list — adding a new gateway
// later means adding one entry here (plus its runtime service logic in
// apps/api), not rebuilding the settings page.

export interface PaymentGatewayFieldDef {
  /** Storage key inside the gateway's `credentials` JSON blob. */
  key: string;
  /** Label shown in the admin form. */
  label: string;
  /** Secret fields are encrypted at rest and masked in the admin UI. */
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  /** Section heading the field renders under in the admin form. */
  group?: string;
  /** Render the value in a monospace font (URLs, technical identifiers). */
  monospace?: boolean;
}

export interface PaymentGatewayDef {
  /** Storage id — matches `payment_gateway_configs.gateway`. */
  id: string;
  name: string;
  fields: PaymentGatewayFieldDef[];
}

export const PAYMENT_GATEWAY_DEFS: PaymentGatewayDef[] = [
  {
    id: "paystation",
    name: "PayStation",
    fields: [
      {
        key: "merchantId",
        label: "Merchant ID",
        secret: false,
        placeholder: "Your PayStation merchant ID",
        helpText: "Found in your PayStation merchant dashboard.",
        group: "Credentials",
      },
      {
        key: "password",
        label: "Password",
        secret: true,
        placeholder: "Your PayStation password",
        helpText: "The password from your PayStation merchant dashboard.",
        group: "Credentials",
      },
      {
        key: "baseUrl",
        label: "API Base URL",
        secret: false,
        placeholder: "https://api.paystation.com.bd",
        helpText: "PayStation's live API host. Only change this if instructed by PayStation support (e.g. for sandbox testing).",
        group: "Advanced",
        monospace: true,
      },
    ],
  },
  {
    id: "bkash",
    name: "bKash",
    fields: [
      {
        key: "username",
        label: "Username",
        secret: false,
        placeholder: "bKash merchant username",
        group: "Authentication",
      },
      {
        key: "password",
        label: "Password",
        secret: true,
        placeholder: "bKash merchant password",
        group: "Authentication",
      },
      {
        key: "appKey",
        label: "API Key",
        secret: false,
        placeholder: "bKash app key",
        group: "Authentication",
        monospace: true,
      },
      {
        key: "appSecret",
        label: "Secret Key",
        secret: true,
        placeholder: "bKash app secret",
        group: "Authentication",
      },
      {
        key: "grantTokenUrl",
        label: "Grant Token URL",
        secret: false,
        placeholder: "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant",
        group: "API Endpoints",
        monospace: true,
      },
      {
        key: "createPaymentUrl",
        label: "Create Payment URL",
        secret: false,
        placeholder: "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/create",
        group: "API Endpoints",
        monospace: true,
      },
      {
        key: "executePaymentUrl",
        label: "Execute Payment URL",
        secret: false,
        placeholder: "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/execute",
        group: "API Endpoints",
        monospace: true,
      },
      {
        key: "refundPaymentUrl",
        label: "Refund Payment URL",
        secret: false,
        placeholder: "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/payment/refund",
        group: "API Endpoints",
        monospace: true,
      },
    ],
  },
];

export type PaymentGatewayId = (typeof PAYMENT_GATEWAY_DEFS)[number]["id"];

export function getPaymentGatewayDef(id: string): PaymentGatewayDef | undefined {
  return PAYMENT_GATEWAY_DEFS.find((g) => g.id === id);
}
