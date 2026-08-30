import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { LessonsService } from 'src/lessons/lessons.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly svc: WebhooksService,
    private readonly lessonsService: LessonsService,
  ) {}

  // ── Mux webhook (legacy) ──────────────────────────────────────────────────────

  @Post('mux')
  @HttpCode(HttpStatus.OK)
  async handleMux(
    @Req() req: any,
    @Headers('mux-signature') signature: string,
  ) {
    const rawBody: Buffer | undefined = req.rawBody;

    if (!rawBody || !signature) {
      throw new BadRequestException('Missing signature or body');
    }

    const isValid = this.svc.verifySignature(rawBody, signature);
    if (!isValid) throw new BadRequestException('Invalid Mux webhook signature');

    const event = JSON.parse(rawBody.toString());
    await this.svc.handleMuxEvent(event);

    return { received: true };
  }

  // ── Bunny Stream webhook ──────────────────────────────────────────────────────
  // Bunny calls this when a video finishes encoding (or fails).
  // Payload: { VideoGuid, Status, VideoLibraryId, ...}
  // Status codes: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding,
  //               4=Finished, 5=Error, 6=UploadFailed

  @Post('bunny')
  @HttpCode(HttpStatus.OK)
  async handleBunny(@Body() body: any) {
    const videoId: string = body?.VideoGuid;
    const statusCode: number = body?.Status;

    if (!videoId) return { received: true };

    if (statusCode === 4) {
      // Finished — Bunny provides duration in seconds in the payload
      const duration = Math.round(body?.Length ?? body?.Duration ?? 0);
      await this.lessonsService.updateBunnyStatus(videoId, 'ready', duration);
    } else if (statusCode === 5 || statusCode === 6) {
      // Error or UploadFailed
      await this.lessonsService.updateBunnyStatus(videoId, 'failed');
    }
    // Other status codes (processing/transcoding) — update to 'processing'
    else if (statusCode === 2 || statusCode === 3) {
      await this.lessonsService.updateBunnyStatus(videoId, 'processing');
    }

    return { received: true };
  }
}
