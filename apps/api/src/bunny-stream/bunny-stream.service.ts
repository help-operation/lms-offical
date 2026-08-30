import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { StorageConfigService } from 'src/storage-config/storage-config.service';

export interface TusCredentials {
  tusEndpoint: string;
  authorizationSignature: string;
  authorizationExpire: number;
  videoId: string;
  libraryId: string;
}

interface BunnyCreds {
  libraryId: string;
  apiKey: string;
  tokenKey: string;
}

@Injectable()
export class BunnyStreamService {
  private readonly logger = new Logger(BunnyStreamService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * Fetches decrypted credentials from the DB on every call — same
   * "no caching, always current" approach as UploadService.getR2() — so a
   * key rotation in Admin → Settings → Configaction takes effect on the
   * very next call. Falls back to the BUNNY_* env vars for any field the
   * admin hasn't set in the UI.
   */
  private async getCreds(): Promise<BunnyCreds> {
    const creds = await this.storageConfig.getDecryptedCredentials('bunny');

    const libraryId = creds.libraryId?.trim() || this.config.get<string>('BUNNY_LIBRARY_ID');
    const apiKey     = creds.apiKey?.trim()     || this.config.get<string>('BUNNY_API_KEY');
    const tokenKey   = creds.tokenAuthKey?.trim() || this.config.get<string>('BUNNY_TOKEN_AUTH_KEY');

    if (!libraryId || !apiKey || !tokenKey) {
      throw new InternalServerErrorException(
        'Bunny Stream is not configured. Set it in Admin → Settings → Configaction.',
      );
    }

    return { libraryId, apiKey, tokenKey };
  }

  // ── Create a video entry on Bunny Stream ────────────────────────────────────

  async createVideo(title: string): Promise<string> {
    const { libraryId, apiKey } = await this.getCreds();
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ title }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bunny Stream: failed to create video — ${body}`);
    }

    const data = await res.json();
    return data.guid as string;
  }

  // ── Generate TUS upload credentials for direct browser → Bunny upload ───────
  // The browser uploads using the TUS protocol with these headers.
  // The API key is never exposed — only the short-lived HMAC signature is.

  async getTusCredentials(videoId: string): Promise<TusCredentials> {
    const { libraryId, apiKey } = await this.getCreds();
    const authorizationExpire = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const authorizationSignature = createHash('sha256')
      .update(
        `${libraryId}${apiKey}${authorizationExpire}${videoId}`,
      )
      .digest('hex');

    return {
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      authorizationSignature,
      authorizationExpire,
      videoId,
      libraryId,
    };
  }

  // ── Generate a signed iframe URL for secure playback ────────────────────────
  // Token = SHA256(tokenKey + videoId + expires)
  // Students only receive this URL — it expires and is per-request.

  async getSignedIframeUrl(videoId: string, expiresInSeconds = 14400): Promise<string> {
    const { libraryId, tokenKey } = await this.getCreds();
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = createHash('sha256')
      .update(`${tokenKey}${videoId}${expires}`)
      .digest('hex');

    // autoplay=false → never start on its own; preload=true keeps the poster.
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}&autoplay=false&preload=true`;
  }

  // ── Live encoding status (self-heal when the webhook was missed) ────────────
  // Bunny status codes: 0=Created 1=Uploaded 2=Processing 3=Transcoding
  //                     4=Finished 5=Error 6=UploadFailed
  async getVideoStatus(
    videoId: string,
  ): Promise<{ state: 'ready' | 'processing' | 'failed'; duration: number }> {
    try {
      const { libraryId, apiKey } = await this.getCreds();
      const res = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        { headers: { AccessKey: apiKey, Accept: 'application/json' } },
      );
      if (!res.ok) return { state: 'processing', duration: 0 };

      const v = await res.json();
      const status = Number(v?.status);
      const duration = Math.round(Number(v?.length ?? 0));

      if (status === 4) return { state: 'ready', duration };
      if (status === 5 || status === 6) return { state: 'failed', duration };
      return { state: 'processing', duration };
    } catch (err) {
      this.logger.warn(`Bunny status check failed for ${videoId}: ${err}`);
      return { state: 'processing', duration: 0 };
    }
  }

  // ── Delete a video from Bunny Stream ────────────────────────────────────────

  async deleteVideo(videoId: string): Promise<void> {
    try {
      const { libraryId, apiKey } = await this.getCreds();
      const res = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
          method: 'DELETE',
          headers: { AccessKey: apiKey, Accept: 'application/json' },
        },
      );
      // 404 = already gone (treat as success). Other non-OK = log so a
      // silent orphan doesn't go unnoticed (still non-fatal).
      if (!res.ok && res.status !== 404) {
        const body = await res.text().catch(() => '');
        this.logger.warn(
          `Bunny delete failed for ${videoId}: HTTP ${res.status} ${body}`,
        );
      } else {
        this.logger.log(`Bunny video ${videoId} deleted (HTTP ${res.status})`);
      }
    } catch (err) {
      this.logger.warn(`Bunny delete error for ${videoId}: ${err}`);
    }
  }
}
