import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { UploadService } from './upload.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('upload_media')
@Controller('course-builder/upload')
export class UploadController {
  constructor(private readonly svc: UploadService) {}

  @Post('video')
  @Message('Mux upload URL created')
  createVideoUpload(@Body('corsOrigin') corsOrigin?: string) {
    return this.svc.createMuxUpload(corsOrigin ?? '*');
  }

  @Post('thumbnail')
  @Message('Thumbnail upload URL created')
  createThumbnailUpload(@Body('contentType') contentType?: string) {
    return this.svc.createThumbnailUploadUrl('thumbnails', contentType ?? 'image/jpeg');
  }

  @Post('avatar')
  @Message('Avatar upload URL created')
  createAvatarUpload(@Body('contentType') contentType?: string) {
    return this.svc.createThumbnailUploadUrl('avatars', contentType ?? 'image/jpeg');
  }
}
