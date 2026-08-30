import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import {
  CurrentUser,
  type RequestUser,
} from 'src/common/decorators/current-user.decorator';
import { CertificatesService } from './certificates.service';
import type { TableQueryInput } from 'src/common/utils/table-query.util';

@Controller()
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ─── Student Routes ───────────────────────────────────────────────────────

  @Post('certificates/claim/:courseId')
  @UseGuards(JwtAuthGuard)
  @Message('Certificate issued')
  claimCertificate(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.certificatesService.claimCertificate(user.userId, courseId);
  }

  @Post('certificates/claim-live/:liveCourseId')
  @UseGuards(JwtAuthGuard)
  @Message('Certificate issued')
  claimLiveCertificate(
    @CurrentUser() user: RequestUser,
    @Param('liveCourseId', ParseIntPipe) liveCourseId: number,
  ) {
    return this.certificatesService.claimLiveCertificate(user.userId, liveCourseId);
  }

  @Get('certificates/mine')
  @UseGuards(JwtAuthGuard)
  @Message('My certificates fetched')
  getMyCertificates(@CurrentUser() user: RequestUser) {
    return this.certificatesService.getMyCertificates(user.userId);
  }

  // ─── Public Verification ──────────────────────────────────────────────────

  @Get('certificates/verify/:code')
  @Message('Certificate verified')
  verify(@Param('code') code: string) {
    return this.certificatesService.findByCode(code);
  }

  // ─── Admin Routes ─────────────────────────────────────────────────────────

  @Get('admin/certificates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_certificates')
  @Message('Certificates fetched')
  listAll(@Query() query: TableQueryInput) {
    return this.certificatesService.listAll(query);
  }

  @Post('admin/certificates/issue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('issue_certificates')
  @Message('Certificate issued manually')
  issueManually(@Body() body: { userId: number; courseId: number }) {
    return this.certificatesService.issueManually(
      Number(body.userId),
      Number(body.courseId),
    );
  }
}
