import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly config: ConfigService,
  ) {}

  // Mux signature verification is kept for backward compatibility if needed,
  // but all video processing now goes through Bunny Stream.
  verifySignature(_rawBody: Buffer, _signature: string): boolean {
    // Mux is no longer used — always return false so the endpoint is effectively
    // disabled without throwing at import time.
    return false;
  }

  async handleMuxEvent(event: any) {
    this.logger.debug(`Mux event received (ignored — migrated to Bunny): ${event?.type}`);
  }
}
