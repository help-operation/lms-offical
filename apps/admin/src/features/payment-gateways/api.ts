import { apiRequest } from "@/lib/api-client";

export interface AdminGatewayField {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  group?: string;
  monospace?: boolean;
  value?: string;
  isSet?: boolean;
}

export interface AdminGatewayView {
  id: string;
  name: string;
  enabled: boolean;
  isActive: boolean;
  fields: AdminGatewayField[];
}

export const paymentGatewaysApi = {
  list: () => apiRequest<AdminGatewayView[]>("/admin/payment-gateways"),
  update: (gateway: string, body: { enabled?: boolean; credentials?: Record<string, string> }) =>
    apiRequest<AdminGatewayView[]>(`/admin/payment-gateways/${gateway}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  activate: (gateway: string) =>
    apiRequest<AdminGatewayView[]>(`/admin/payment-gateways/${gateway}/activate`, {
      method: "POST",
    }),
};
