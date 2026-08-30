import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller';

/**
 * Exposes manual cache controls (Purge All). `RevalidationService` is provided by
 * the global `RevalidationModule`, so nothing extra needs importing here.
 */
@Module({
  controllers: [CacheController],
})
export class CacheModule {}
