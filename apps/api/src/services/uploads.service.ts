import { uuidv7 } from 'uuidv7';
import {
  UploadPresignRequest,
  UploadPresignRequestSchema,
  UploadPresignResponse,
} from '@wild-hills/contracts';
import { env } from '../config/env.js';
import { getStorageProvider } from '../providers/index.js';
import { quotaService } from './quota.service.js';

export class UploadsService {
  /**
   * Generates a presigned S3/R2 upload URL with storage quotas and MIME validation.
   */
  async presignUpload(data: UploadPresignRequest): Promise<UploadPresignResponse> {
    const parsed = UploadPresignRequestSchema.parse(data);

    // 1. Storage Quota Check (Section 18.3 Cheap Insurance)
    const quota = await quotaService.checkStorageQuota(parsed.fileSizeBytes);
    if (!quota.allowed) {
      const error = new Error(
        `Storage hard limit exceeded (${(quota.hardLimitBytes / (1024 * 1024 * 1024)).toFixed(1)} GB). New uploads are temporarily paused.`
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // 2. MIME & Size limits
    const isImage = parsed.contentType.startsWith('image/');
    const isPdf = parsed.contentType === 'application/pdf';

    if (!isImage && !isPdf) {
      const error = new Error(`Unsupported MIME type: ${parsed.contentType}`);
      (error as any).statusCode = 400;
      throw error;
    }

    if (isImage && parsed.fileSizeBytes > 15 * 1024 * 1024) {
      const error = new Error('Image files must not exceed 15 MB');
      (error as any).statusCode = 400;
      throw error;
    }

    if (isPdf && parsed.fileSizeBytes > 25 * 1024 * 1024) {
      const error = new Error('Document PDF files must not exceed 25 MB');
      (error as any).statusCode = 400;
      throw error;
    }

    // 3. Generate sanitized object key
    const fileExt = parsed.fileName.includes('.')
      ? `.${parsed.fileName.split('.').pop()!.toLowerCase()}`
      : isPdf
        ? '.pdf'
        : '.jpg';

    const cleanBaseName = parsed.fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    const keyFolder =
      parsed.category === 'document' ? 'submissions/documents' : 'submissions/photos';
    const key = `${keyFolder}/${uuidv7()}-${cleanBaseName}${fileExt}`;

    const bucket = env.S3_BUCKET_PUBLIC || 'wildhills-media';
    const storage = getStorageProvider();
    const presigned = await storage.getPresignedUploadUrl(bucket, key, 3600);

    return {
      uploadUrl: presigned.uploadUrl,
      key,
      expiresInSeconds: 3600,
    };
  }
}

export const uploadsService = new UploadsService();
