import { Module } from '@nestjs/common';
import { PageSectionsService } from './page-sections.service';
import { PageSectionsController } from './page-sections.controller';
import { PageSectionsPermissionGuard } from './page-sections-permission.guard';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [PageSectionsController],
  providers: [PageSectionsService, PageSectionsPermissionGuard],
  exports: [PageSectionsService],
})
export class PageSectionsModule {}
