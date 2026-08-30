import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PageSectionsService } from './page-sections.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PageSectionsPermissionGuard } from './page-sections-permission.guard';

@Controller('page-sections')
export class PageSectionsController {
  constructor(private readonly svc: PageSectionsService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get('public/:page')
  async getPublic(@Param('page') page: string) {
    return this.svc.getPublicByPage(page);
  }

  // ─── Admin (per-section permissions) ──────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Get('admin/:page')
  async getAdmin(@Param('page') page: string) {
    return this.svc.getAllByPage(page);
  }

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Post()
  async create(
    @Body()
    body: {
      page: string;
      slug: string;
      label: string;
      type: string;
      order?: number;
      content?: Record<string, unknown>;
    },
  ) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Put('reorder')
  async reorder(@Body() body: { items: { id: number; order: number }[] }) {
    await this.svc.reorder(body.items);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { label?: string; content?: Record<string, unknown> },
  ) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Patch(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggle(id);
  }

  @UseGuards(JwtAuthGuard, PageSectionsPermissionGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.svc.delete(id);
    return { success: true };
  }
}
