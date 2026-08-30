import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CodeSnippetsService } from './code-snippets.service';
import type { CreateSnippetDto, UpdateSnippetDto } from './code-snippets.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@Controller('code-snippets')
export class CodeSnippetsController {
  constructor(private readonly service: CodeSnippetsService) {}

  /** Public — web frontend fetches enabled snippets to inject */
  @Get()
  @HttpCode(HttpStatus.OK)
  getEnabled() {
    return this.service.findEnabled();
  }

  /** Admin — all snippets (including disabled) */
  @Get('all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_code_snippets')
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.service.findAll();
  }

  /** Admin — create snippet */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_code_snippets')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSnippetDto) {
    return this.service.create(dto);
  }

  /** Admin — update snippet */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_code_snippets')
  @HttpCode(HttpStatus.OK)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSnippetDto) {
    return this.service.update(id, dto);
  }

  /** Admin — delete snippet */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_code_snippets')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
