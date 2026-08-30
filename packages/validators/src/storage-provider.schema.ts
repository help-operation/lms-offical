// Code-defined credential schema per external service provider (file storage,
// video hosting, SMS gateway, ...). The admin UI renders each provider's
// settings tile/modal purely from this list — adding a new provider later
// means adding one entry here (plus its runtime wiring in apps/api), not
// rebuilding a settings page. Providers are grouped onto different admin
// pages by id (see StorageSettingsPage's `providerIds` filter).

export interface StorageProviderFieldDef {
  /** Storage key inside the provider's `credentials` JSON blob. */
  key: string;
  /** Label shown in the admin form. */
  label: string;
  /** Secret fields are encrypted at rest and masked in the admin UI. */
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  /** Render the value in a monospace font (URLs, technical identifiers). */
  monospace?: boolean;
}

export interface StorageProviderDef {
  /** Storage id — matches `storage_provider_configs.provider`. */
  id: string;
  name: string;
  fields: StorageProviderFieldDef[];
}

export const STORAGE_PROVIDER_DEFS: StorageProviderDef[] = [
  {
    id: "r2",
    name: "Cloudflare R2",
    fields: [
      {
        key: "endpoint",
        label: "R2 Endpoint",
        secret: false,
        placeholder: "https://<account-id>.r2.cloudflarestorage.com",
        helpText: "Your Cloudflare account's R2 S3 API endpoint.",
        monospace: true,
      },
      {
        key: "accessKeyId",
        label: "Access Key ID",
        secret: false,
        placeholder: "R2 access key ID",
        helpText: "Created under R2 → Manage API Tokens in the Cloudflare dashboard.",
        monospace: true,
      },
      {
        key: "secretAccessKey",
        label: "Secret Access Key",
        secret: true,
        placeholder: "R2 secret access key",
        helpText: "Shown only once when the API token is created — store it securely.",
      },
      {
        key: "bucket",
        label: "Bucket Name",
        secret: false,
        placeholder: "my-bucket",
      },
      {
        key: "url",
        label: "Public URL",
        secret: false,
        placeholder: "https://cdn.example.com",
        helpText: "Public base URL uploaded files are served from (R2 custom domain or r2.dev URL).",
        monospace: true,
      },
      {
        key: "region",
        label: "Region",
        secret: false,
        placeholder: "auto",
        helpText: "R2 doesn't use regions — leave as \"auto\" unless instructed otherwise.",
      },
    ],
  },
  {
    id: "bunny",
    name: "Bunny Stream",
    fields: [
      {
        key: "libraryId",
        label: "Library ID",
        secret: false,
        placeholder: "123456",
        helpText: "Your Bunny Stream video library's numeric ID.",
        monospace: true,
      },
      {
        key: "apiKey",
        label: "API Key",
        secret: true,
        placeholder: "Bunny Stream library API key",
        helpText: "Found under the library's API section in the Bunny dashboard. Used to create, upload, and delete videos.",
      },
      {
        key: "tokenAuthKey",
        label: "Token Authentication Key",
        secret: true,
        placeholder: "Bunny Stream token authentication key",
        helpText: "Used to sign secure, expiring playback URLs so videos can't be viewed outside the platform.",
      },
    ],
  },
  {
    id: "bulksms",
    name: "Bulk SMS",
    fields: [
      {
        key: "senderId",
        label: "Sender ID",
        secret: false,
        placeholder: "Skillkoro",
        helpText: "The masking name/number recipients see as the sender. Must be approved in your BulkSMSBD account.",
      },
      {
        key: "apiKey",
        label: "API Key",
        secret: true,
        placeholder: "BulkSMSBD API key",
        helpText: "Found in your BulkSMSBD dashboard. Used for OTPs, templated event SMS, and broadcasts.",
      },
    ],
  },
];

export type StorageProviderId = (typeof STORAGE_PROVIDER_DEFS)[number]["id"];

export function getStorageProviderDef(id: string): StorageProviderDef | undefined {
  return STORAGE_PROVIDER_DEFS.find((p) => p.id === id);
}
