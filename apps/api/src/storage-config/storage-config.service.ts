import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { storageProviderConfigs } from 'src/db/schema';
import { STORAGE_PROVIDER_DEFS, getStorageProviderDef } from '@repo/validators';
import { CredentialEncryptionService } from 'src/common/crypto/credential-encryption.service';

export interface AdminStorageField {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  monospace?: boolean;
  /** Current value for non-secret fields; omitted for secret fields (see `isSet`). */
  value?: string;
  /** For secret fields — whether a value is currently stored, without exposing it. */
  isSet?: boolean;
}

export interface AdminStorageProviderView {
  id: string;
  name: string;
  fields: AdminStorageField[];
}

@Injectable()
export class StorageConfigService implements OnModuleInit {
  private readonly logger = new Logger(StorageConfigService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  /**
   * Seed a row per known provider if missing. On first-ever creation, pull
   * forward whatever's already set via R2_* env vars so upgrading doesn't
   * silently break uploads — this is a one-time bridge; UploadService reads
   * from this table (falling back to env vars only if the DB has nothing).
   */
  async onModuleInit() {
    const existing = await this.db.select().from(storageProviderConfigs);
    const existingIds = new Set(existing.map((r) => r.provider));

    for (const def of STORAGE_PROVIDER_DEFS) {
      if (existingIds.has(def.id)) continue;

      const credentials: Record<string, string> = {};

      if (def.id === 'r2') {
        const envMap: Record<string, string | undefined> = {
          endpoint: process.env.R2_ENDPOINT,
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          bucket: process.env.R2_BUCKET,
          url: process.env.R2_URL,
          region: process.env.R2_REGION,
        };
        for (const field of def.fields) {
          const raw = envMap[field.key]?.trim();
          if (!raw) continue;
          credentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
        }
      }

      if (def.id === 'bunny') {
        const envMap: Record<string, string | undefined> = {
          libraryId: process.env.BUNNY_LIBRARY_ID,
          apiKey: process.env.BUNNY_API_KEY,
          tokenAuthKey: process.env.BUNNY_TOKEN_AUTH_KEY,
        };
        for (const field of def.fields) {
          const raw = envMap[field.key]?.trim();
          if (!raw) continue;
          credentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
        }
      }

      if (def.id === 'bulksms') {
        const envMap: Record<string, string | undefined> = {
          senderId: process.env.BULKSMSBD_SENDER_ID,
          apiKey: process.env.BULKSMSBD_API_KEY,
        };
        for (const field of def.fields) {
          const raw = envMap[field.key]?.trim();
          if (!raw) continue;
          credentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
        }
      }

      await this.db.insert(storageProviderConfigs).values({
        provider: def.id,
        credentials,
      });

      const hasAnyCredential = Object.keys(credentials).length > 0;
      this.logger.log(`Seeded storage provider config for '${def.id}'${hasAnyCredential ? ' (migrated from env vars)' : ''}`);
    }
  }

  /** Admin-facing list — secret values are never returned, only whether they're set. */
  async listForAdmin(): Promise<AdminStorageProviderView[]> {
    const rows = await this.db.select().from(storageProviderConfigs);
    const byProvider = new Map(rows.map((r) => [r.provider, r]));

    return STORAGE_PROVIDER_DEFS.map((def) => {
      const row = byProvider.get(def.id);
      const credentials = row?.credentials ?? {};

      return {
        id: def.id,
        name: def.name,
        fields: def.fields.map((f) => ({
          key: f.key,
          label: f.label,
          secret: f.secret,
          placeholder: f.placeholder,
          helpText: f.helpText,
          monospace: f.monospace,
          ...(f.secret
            ? { isSet: !!credentials[f.key]?.trim() }
            : { value: credentials[f.key] ?? '' }),
        })),
      };
    });
  }

  /**
   * Partial update: only keys present in `fields` are written. Leaving a
   * secret field out of the payload keeps its stored value untouched — the
   * admin UI never round-trips secret values back to the server.
   */
  async updateCredentials(providerId: string, fields: Record<string, string>): Promise<void> {
    const def = getStorageProviderDef(providerId);
    if (!def) throw new BadRequestException(`Unknown storage provider '${providerId}'`);

    const validKeys = new Set(def.fields.map((f) => f.key));
    for (const key of Object.keys(fields)) {
      if (!validKeys.has(key)) {
        throw new BadRequestException(`Unknown credential field '${key}' for provider '${providerId}'`);
      }
    }

    const [row] = await this.db
      .select()
      .from(storageProviderConfigs)
      .where(eq(storageProviderConfigs.provider, providerId))
      .limit(1);
    if (!row) throw new BadRequestException(`Storage provider '${providerId}' is not configured`);

    const nextCredentials = { ...row.credentials };
    for (const field of def.fields) {
      if (!(field.key in fields)) continue;
      const raw = fields[field.key] ?? '';
      nextCredentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
    }

    await this.db
      .update(storageProviderConfigs)
      .set({ credentials: nextCredentials, updatedAt: new Date() })
      .where(eq(storageProviderConfigs.provider, providerId));
  }

  /** Internal — decrypted values for UploadService to build its S3 client from. */
  async getDecryptedCredentials(providerId: string): Promise<Record<string, string>> {
    const def = getStorageProviderDef(providerId);
    const [row] = await this.db
      .select()
      .from(storageProviderConfigs)
      .where(eq(storageProviderConfigs.provider, providerId))
      .limit(1);
    if (!row) return {};

    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(row.credentials)) {
      const fieldDef = def?.fields.find((f) => f.key === key);
      out[key] = fieldDef?.secret ? this.encryption.decrypt(value) : value;
    }
    return out;
  }
}
