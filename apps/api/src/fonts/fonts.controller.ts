import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FontsService } from './fonts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@Controller('fonts')
export class FontsController {
  constructor(private readonly svc: FontsService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get()
  async getFonts(@Query('script') script?: string) {
    return this.svc.getFonts(script);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_fonts')
  @Get('admin')
  async getAdminFonts() {
    return this.svc.getAllFonts();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_fonts')
  @Post('refresh')
  async refreshCache() {
    return this.svc.refreshCache();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_fonts')
  @Delete(':id')
  async deleteFont(@Param('id', ParseIntPipe) id: number) {
    await this.svc.deleteFont(id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_fonts')
  @Patch(':id/toggle')
  async toggleFont(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleFontActive(id);
  }

  @Get('file/:filename')
  async getFontFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'fonts', 'custom', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Font file not found' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
    };

    res.set({
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return res.sendFile(filePath);
  }
}
