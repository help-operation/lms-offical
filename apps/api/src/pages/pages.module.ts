import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { PagesPermissionGuard } from './pages-permission.guard';

@Module({
  controllers: [PagesController],
  providers: [PagesService, PagesPermissionGuard],
})
export class PagesModule {}
