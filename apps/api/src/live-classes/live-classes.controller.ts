import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LiveClassesService } from './live-classes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('live-classes')
export class LiveClassesController {
  constructor(private svc: LiveClassesService) {}

  @Get()
  @Public()
  listUpcoming() {
    return this.svc.listUpcoming();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_live')
  listMine(@CurrentUser() user: { id: number }) {
    return this.svc.listByInstructor(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_live')
  create(
    @CurrentUser() user: { id: number },
    @Body()
    body: {
      title: string;
      description?: string;
      scheduledAt: string;
      meetingUrl?: string;
      courseId?: number;
    },
  ) {
    return this.svc.create(user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_live')
  update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      title?: string;
      description?: string;
      scheduledAt?: string;
      meetingUrl?: string;
      status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
    },
  ) {
    return this.svc.update(id, user.id, body);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  rsvp(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.rsvp(user.id, id);
  }

  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_live')
  attendees(@Param('id', ParseIntPipe) id: number) {
    return this.svc.attendees(id);
  }
}
