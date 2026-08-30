import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { CertificatesModule } from 'src/certificates/certificates.module';

@Module({
  imports: [CertificatesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
