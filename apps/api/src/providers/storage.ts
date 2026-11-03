import { env } from '../config/env.js';

export interface PutObjectOptions {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface ObjectStorage {
  putObject(options: PutObjectOptions): Promise<{ key: string; etag: string; url: string }>;
  getObject(bucket: string, key: string): Promise<{ body: Buffer; contentType?: string }>;
  deleteObject(bucket: string, key: string): Promise<void>;
  getPresignedUploadUrl(
    bucket: string,
    key: string,
    expiresInSeconds?: number
  ): Promise<{ uploadUrl: string; key: string }>;
  getSignedDownloadUrl?(
    bucket: string,
    key: string,
    expiresInSeconds?: number
  ): Promise<string>;
  getUsageBytes(bucket: string): Promise<number>;
}

/**
 * MinIO / S3-compatible local development adapter
 */
export class MinioStorageAdapter implements ObjectStorage {
  private inMemoryObjects = new Map<string, { body: Buffer; contentType: string }>();

  constructor(
    private endpoint = env.S3_ENDPOINT,
    private accessKey = env.S3_ACCESS_KEY_ID,
    private secretKey = env.S3_SECRET_ACCESS_KEY
  ) {}

  async putObject(options: PutObjectOptions) {
    const fullKey = `${options.bucket}/${options.key}`;
    const buffer = Buffer.isBuffer(options.body)
      ? options.body
      : Buffer.from(options.body);

    this.inMemoryObjects.set(fullKey, {
      body: buffer,
      contentType: options.contentType,
    });

    const etag = `"${Math.random().toString(36).substring(2, 12)}"`;
    const url = `${this.endpoint}/${options.bucket}/${options.key}`;

    return {
      key: options.key,
      etag,
      url,
    };
  }

  async getObject(bucket: string, key: string) {
    const fullKey = `${bucket}/${key}`;
    const item = this.inMemoryObjects.get(fullKey);
    if (!item) {
      throw new Error(`Object not found: ${fullKey}`);
    }
    return item;
  }

  async deleteObject(bucket: string, key: string) {
    const fullKey = `${bucket}/${key}`;
    this.inMemoryObjects.delete(fullKey);
  }

  async getPresignedUploadUrl(bucket: string, key: string, _expiresInSeconds = 3600) {
    return {
      uploadUrl: `${this.endpoint}/${bucket}/${key}?mock-presigned=true`,
      key,
    };
  }

  async getSignedDownloadUrl(bucket: string, key: string, expiresInSeconds = 60): Promise<string> {
    return `${this.endpoint}/${bucket}/${key}?mock-signed=true&expiresIn=${expiresInSeconds}`;
  }

  async getUsageBytes(bucket: string): Promise<number> {
    let total = 0;
    for (const [key, val] of this.inMemoryObjects.entries()) {
      if (key.startsWith(`${bucket}/`)) {
        total += val.body.length;
      }
    }
    return total;
  }
}

