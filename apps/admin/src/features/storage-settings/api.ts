import { apiRequest } from "@/lib/api-client";

export interface AdminStorageField {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  monospace?: boolean;
  value?: string;
  isSet?: boolean;
}

export interface AdminStorageProviderView {
  id: string;
  name: string;
  fields: AdminStorageField[];
}

export const storageConfigApi = {
  list: () => apiRequest<AdminStorageProviderView[]>("/admin/storage-config"),
  update: (provider: string, body: { credentials: Record<string, string> }) =>
    apiRequest<AdminStorageProviderView[]>(`/admin/storage-config/${provider}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
