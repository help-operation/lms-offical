import { Global, Module } from '@nestjs/common';
import { RevalidationService } from './revalidation.service';

/**
 * Global so any feature service can inject `RevalidationService` without importing
 * this module. `ConfigService` is already global (see `ConfigModule.forRoot`).
 */
@Global()
@Module({
  providers: [RevalidationService],
  exports: [RevalidationService],
})
export class RevalidationModule {}
