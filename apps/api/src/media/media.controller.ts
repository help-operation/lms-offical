import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { MediaService } from './media.service';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_media')
export class MediaController {
  constructor(private readonly svc: MediaService) {}

  // ── GET /admin/media ─────────────────────────────────────────────────────────
  @Get()
  @Message('Media files fetched')
  list(
    @Query('page')           page?: string,
    @Query('per_page')       perPage?: string,
    @Query('search')         search?: string,
    @Query('type')           type?: string,
    @Query('sort_field')     sortField?: string,
    @Query('sort_direction') sortDirection?: string,
  ) {
    return this.svc.list({
      page:          page    ? parseInt(page, 10)    : 1,
      perPage:       perPage ? parseInt(perPage, 10) : 20,
      search:        search     || undefined,
      type:          type       || undefined,
      sortField:     (sortField as 'created_at' | 'filename' | 'size' | 'type') || 'created_at',
      sortDirection: sortDirection === 'asc' ? 'asc' : 'desc',
    });
  }

  // ── POST /admin/media/presign ─────────────────────────────────────────────────
  // Step 1: get a presigned PUT URL so the browser can upload directly to R2
  @RequirePermissions('upload_media')
  @Post('presign')
  @Message('Presigned URL generated')
  presign(@Body() body: { mimeType: string; filename: string }) {
    return this.svc.presign(body.mimeType, body.filename);
  }

  // ── POST /admin/media/register ────────────────────────────────────────────────
  // Step 2: after the browser finishes the R2 PUT, save the file record to DB
  @RequirePermissions('upload_media')
  @Post('register')
  @Message('File registered')
  register(
    @Body() body: {
      url:          string;
      key:          string;
      filename:     string;
      originalName: string;
      mimeType:     string;
      size:         number;
    },
    @Req() req: any,
  ) {
    const uploadedBy: number | undefined = req.user?.id;
    return this.svc.register({ ...body, uploadedBy });
  }

  // ── PATCH /admin/media/:id ────────────────────────────────────────────────────
  @RequirePermissions('update_media')
  @Patch(':id')
  @Message('Media file updated')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { filename?: string; altText?: string; caption?: string },
  ) {
    return this.svc.update(id, body);
  }

  // ── DELETE /admin/media/:id ───────────────────────────────────────────────────
  @RequirePermissions('delete_media')
  @Delete(':id')
  @Message('Media file deleted')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }

  // ── POST /admin/media/bulk-delete ─────────────────────────────────────────────
  @RequirePermissions('delete_media')
  @Post('bulk-delete')
  @Message('Media files deleted')
  bulkDelete(@Body() body: { ids: number[] }) {
    return this.svc.bulkDelete(body.ids);
  }
}
