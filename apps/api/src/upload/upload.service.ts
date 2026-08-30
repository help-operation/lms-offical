import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mux from '@mux/mux-node';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { StorageConfigService } from 'src/storage-config/storage-config.service';

interface R2Handle {
  s3: S3Client;
  bucket: string;
  publicUrl: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private _mux: Mux | null = null;

  constructor(
    private config: ConfigService,
    private storageConfig: StorageConfigService,
  ) {}

  private getMux(): Mux {
    if (!this._mux) {
      this._mux = new Mux({
        tokenId: this.config.getOrThrow('MUX_TOKEN_ID'),
        tokenSecret: this.config.getOrThrow('MUX_TOKEN_SECRET'),
      });
    }
    return this._mux;
  }

  /**
   * Builds a fresh R2 client from admin-configured (DB) credentials on every
   * call — same "no caching, always current" approach as the payment gateway
   * services, so a credential rotation in Admin → Settings → Configaction
   * takes effect on the very next upload with no restart. Falls back to the
   * R2_* env vars only for whichever fields the admin hasn't set in the UI.
   */
  private async getR2(): Promise<R2Handle> {
    const creds = await this.storageConfig.getDecryptedCredentials('r2');

    const endpoint  = creds.endpoint?.trim()  || this.config.get<string>('R2_ENDPOINT');
    const accessKeyId     = creds.accessKeyId?.trim()     || this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = creds.secretAccessKey?.trim() || this.config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket    = creds.bucket?.trim()    || this.config.get<string>('R2_BUCKET');
    const publicUrl = creds.url?.trim()       || this.config.get<string>('R2_URL');
    const region    = creds.region?.trim()    || 'auto';

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set it in Admin → Settings → Configaction.',
      );
    }

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // R2 requires path-style URLs (bucket in path, not subdomain)
      forcePathStyle: true,
      // Disable auto-checksum injection — browser XHR cannot fulfil CRC32 headers
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });

    return { s3, bucket, publicUrl };
  }

  async createMuxUpload(corsOrigin: string = '*') {
    const upload = await this.getMux().video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'smart',
      },
    });

    return {
      uploadId: upload.id,
      uploadUrl: upload.url,
    };
  }

  async createThumbnailUploadUrl(
    folder: 'thumbnails' | 'avatars' | 'resources' = 'thumbnails',
    contentType: string = 'image/jpeg',
  ) {
    const { s3, bucket, publicUrl: base } = await this.getR2();
    const ext = contentType.split('/')[1] ?? 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${base}/${key}`;

    return { presignedUrl, publicUrl, key };
  }

  // ─── Media library: presigned upload URL ──────────────────────────────────

  async createMediaPresignUrl(mimeType: string, originalName: string) {
    const { s3, bucket, publicUrl: base } = await this.getR2();
    const ext = path.extname(originalName).toLowerCase() ||
                '.' + (mimeType.split('/')[1] ?? 'bin');
    const key = `media/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl    = `${base}/${key}`;

    return { presignedUrl, publicUrl, key };
  }

  // ─── Media library: delete file from R2 ───────────────────────────────────

  async deleteMediaFile(publicUrl: string) {
    try {
      const { s3, bucket, publicUrl: base } = await this.getR2();
      const key = publicUrl.replace(`${base}/`, '');
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      // Best-effort — log but don't block the DB operation
      this.logger.warn(`Failed to delete R2 object: ${publicUrl}`);
    }
  }
}
