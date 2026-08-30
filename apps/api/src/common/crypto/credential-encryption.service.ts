import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

/**
 * Encrypts/decrypts payment gateway secret fields (passwords, API secrets)
 * before they're written to `payment_gateway_configs.credentials`. The key
 * is derived from PAYMENT_CREDENTIALS_ENCRYPTION_KEY — an application-level
 * secret set once at deploy time (like JWT_SECRET), not a payment credential
 * the admin manages day-to-day.
 */
@Injectable()
export class CredentialEncryptionService {
  private readonly logger = new Logger(CredentialEncryptionService.name);
  private key: Buffer | null = null;

  private getKey(): Buffer {
    if (this.key) return this.key;

    const secret = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
    if (!secret) {
      this.logger.warn(
        'PAYMENT_CREDENTIALS_ENCRYPTION_KEY is not set — falling back to JWT_SECRET. Set a dedicated key in production.',
      );
    }
    const material = secret || process.env.JWT_SECRET || 'insecure-default-key-change-me';
    this.key = crypto.scryptSync(material, 'payment-gateway-credentials', 32);
    return this.key;
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(value: string): string {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length !== 3) {
      // Not our encrypted format — treat as unencrypted legacy value rather
      // than throwing, so a stray plain value doesn't hard-crash checkout.
      return value;
    }
    const [ivHex, authTagHex, dataHex] = parts;
    try {
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        this.getKey(),
        Buffer.from(ivHex!, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(authTagHex!, 'hex'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataHex!, 'hex')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      this.logger.error('Failed to decrypt credential value', err as Error);
      return '';
    }
  }
}
