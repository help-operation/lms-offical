import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { UploadModule } from '../upload/upload.module';
import { StorageConfigModule } from '../storage-config/storage-config.module';

@Module({
  imports: [UploadModule, StorageConfigModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
