import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { Message } from 'src/common/decorators/message.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PagesPermissionGuard } from './pages-permission.guard';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // Public — web frontend fetches this for display
  @Get(':slug')
  @Message('Page fetched successfully')
  async getPage(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  // Protected — per-slug update permission (update_page_*)
  @UseGuards(JwtAuthGuard, PagesPermissionGuard)
  @Put(':slug')
  @HttpCode(HttpStatus.OK)
  @Message('Page updated successfully')
  async updatePage(
    @Param('slug') slug: string,
    @Body('content') content: string,
  ) {
    return this.pagesService.update(slug, content);
  }
}
