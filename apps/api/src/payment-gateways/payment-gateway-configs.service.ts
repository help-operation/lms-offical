import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { eq, ne } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { paymentGatewayConfigs, systemSettings } from 'src/db/schema';
import { PAYMENT_GATEWAY_DEFS, getPaymentGatewayDef } from '@repo/validators';
import { CredentialEncryptionService } from 'src/common/crypto/credential-encryption.service';

export interface AdminGatewayField {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  helpText?: string;
  group?: string;
  monospace?: boolean;
  /** Current value for non-secret fields; omitted for secret fields (see `isSet`). */
  value?: string;
  /** For secret fields — whether a value is currently stored, without exposing it. */
  isSet?: boolean;
}

export interface AdminGatewayView {
  id: string;
  name: string;
  enabled: boolean;
  isActive: boolean;
  fields: AdminGatewayField[];
}

@Injectable()
export class PaymentGatewayConfigsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentGatewayConfigsService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  /**
   * Seed a row per known gateway if missing. On first-ever creation of a
   * gateway's row, pull forward whatever was previously configured via
   * system_settings (PayStation) or env vars (bKash) so upgrading doesn't
   * silently break checkout — this is a one-time bridge; nothing reads
   * system_settings payment_* keys or BKASH_* env vars after this.
   */
  async onModuleInit() {
    const existing = await this.db.select().from(paymentGatewayConfigs);
    const existingIds = new Set(existing.map((r) => r.gateway));

    const [activeSetting] = await this.db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'payment_active_gateway'))
      .limit(1);
    const previouslyActive = activeSetting?.value?.trim().toLowerCase() || 'paystation';

    for (const def of PAYMENT_GATEWAY_DEFS) {
      if (existingIds.has(def.id)) continue;

      const credentials: Record<string, string> = {};

      if (def.id === 'paystation') {
        const rows = await this.db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, 'payment_merchant_id'));
        const merchantId = rows[0]?.value?.trim() || '';
        const [secretRow] = await this.db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, 'payment_secret_key'))
          .limit(1);
        const password = secretRow?.value?.trim() || '';

        if (merchantId) credentials.merchantId = merchantId;
        if (password) credentials.password = this.encryption.encrypt(password);
      }

      if (def.id === 'bkash') {
        const envMap: Record<string, string | undefined> = {
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD,
          appKey: process.env.BKASH_API_KEY,
          appSecret: process.env.BKASH_SECRET_KEY,
          grantTokenUrl: process.env.BKASH_GRANT_TOKEN_URL,
          createPaymentUrl: process.env.BKASH_CREATE_PAYMENT_URL,
          executePaymentUrl: process.env.BKASH_EXECUTE_PAYMENT_URL,
          refundPaymentUrl: process.env.BKASH_REFUND_PAYMENT_URL,
        };
        for (const field of def.fields) {
          const raw = envMap[field.key]?.trim();
          if (!raw) continue;
          credentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
        }
      }

      const hasAnyCredential = Object.keys(credentials).length > 0;

      await this.db.insert(paymentGatewayConfigs).values({
        gateway: def.id,
        enabled: hasAnyCredential,
        isActive: def.id === previouslyActive && hasAnyCredential,
        credentials,
      });

      this.logger.log(`Seeded payment gateway config for '${def.id}'${hasAnyCredential ? ' (migrated existing credentials)' : ''}`);
    }
  }

  /** Admin-facing list — secret values are never returned, only whether they're set. */
  async listForAdmin(): Promise<AdminGatewayView[]> {
    const rows = await this.db.select().from(paymentGatewayConfigs);
    const byGateway = new Map(rows.map((r) => [r.gateway, r]));

    return PAYMENT_GATEWAY_DEFS.map((def) => {
      const row = byGateway.get(def.id);
      const credentials = row?.credentials ?? {};

      return {
        id: def.id,
        name: def.name,
        enabled: row?.enabled ?? false,
        isActive: row?.isActive ?? false,
        fields: def.fields.map((f) => ({
          key: f.key,
          label: f.label,
          secret: f.secret,
          placeholder: f.placeholder,
          helpText: f.helpText,
          group: f.group,
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
  async updateCredentials(gatewayId: string, fields: Record<string, string>): Promise<void> {
    const def = getPaymentGatewayDef(gatewayId);
    if (!def) throw new BadRequestException(`Unknown payment gateway '${gatewayId}'`);

    const validKeys = new Set(def.fields.map((f) => f.key));
    for (const key of Object.keys(fields)) {
      if (!validKeys.has(key)) {
        throw new BadRequestException(`Unknown credential field '${key}' for gateway '${gatewayId}'`);
      }
    }

    const [row] = await this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.gateway, gatewayId))
      .limit(1);
    if (!row) throw new BadRequestException(`Payment gateway '${gatewayId}' is not configured`);

    const nextCredentials = { ...row.credentials };
    for (const field of def.fields) {
      if (!(field.key in fields)) continue;
      const raw = fields[field.key] ?? '';
      nextCredentials[field.key] = field.secret ? this.encryption.encrypt(raw) : raw;
    }

    await this.db
      .update(paymentGatewayConfigs)
      .set({ credentials: nextCredentials, updatedAt: new Date() })
      .where(eq(paymentGatewayConfigs.gateway, gatewayId));
  }

  async setEnabled(gatewayId: string, enabled: boolean): Promise<void> {
    if (!getPaymentGatewayDef(gatewayId)) {
      throw new BadRequestException(`Unknown payment gateway '${gatewayId}'`);
    }

    await this.db
      .update(paymentGatewayConfigs)
      .set({
        enabled,
        // Disabling the active gateway clears isActive too — checkout should
        // surface a clear "not configured" error rather than silently using
        // a disabled gateway.
        ...(enabled ? {} : { isActive: false }),
        updatedAt: new Date(),
      })
      .where(eq(paymentGatewayConfigs.gateway, gatewayId));
  }

  async setActiveGateway(gatewayId: string): Promise<void> {
    const [row] = await this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.gateway, gatewayId))
      .limit(1);
    if (!row) throw new BadRequestException(`Payment gateway '${gatewayId}' is not configured`);
    if (!row.enabled) throw new BadRequestException(`Enable '${gatewayId}' before setting it active`);

    // No interactive transactions on the Neon HTTP driver — two sequential
    // updates is fine for a low-frequency admin action.
    await this.db
      .update(paymentGatewayConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(ne(paymentGatewayConfigs.gateway, gatewayId));

    await this.db
      .update(paymentGatewayConfigs)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(paymentGatewayConfigs.gateway, gatewayId));
  }

  async getActiveGateway(): Promise<string> {
    const [row] = await this.db
      .select({ gateway: paymentGatewayConfigs.gateway })
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.isActive, true))
      .limit(1);
    if (!row) {
      throw new BadRequestException('No payment gateway is active. Configure one in Admin → Settings → Payments.');
    }
    return row.gateway;
  }

  /** Internal — decrypted values for the runtime gateway service to use. */
  async getDecryptedCredentials(gatewayId: string): Promise<Record<string, string>> {
    const def = getPaymentGatewayDef(gatewayId);
    const [row] = await this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.gateway, gatewayId))
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
