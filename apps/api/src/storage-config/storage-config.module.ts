import { Module } from '@nestjs/common';
import { StorageConfigService } from './storage-config.service';
import { StorageConfigController } from './storage-config.controller';
import { CredentialEncryptionService } from 'src/common/crypto/credential-encryption.service';

// Leaf module — DB-backed source of truth for file-storage provider (R2)
// credentials. Imported by UploadModule so UploadService can build its S3
// client from admin-configured, encrypted values instead of raw env vars.
@Module({
  controllers: [StorageConfigController],
  providers: [StorageConfigService, CredentialEncryptionService],
  exports: [StorageConfigService],
})
export class StorageConfigModule {}
