import { config } from 'dotenv';
import { z } from 'zod';

// Load .env in non-production environments
if (process.env.NODE_ENV !== 'production') {
  config();
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgres://wh_owner:change-me-password@localhost:5432/wild_hills'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  REVALIDATE_SECRET: z.string().default('dev-revalidate-secret'),
  IMAGE_CDN_HOST: z.string().default('http://localhost:9000'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_BUCKET_PUBLIC: z.string().default('wild-hills-public'),
  S3_BUCKET_PRIVATE: z.string().default('wild-hills-private'),
  S3_BUCKET_BACKUPS: z.string().default('wild-hills-backups'),
  RESEND_API_KEY: z.string().optional().default('re_dummy_dev_key'),
  EMAIL_DAILY_CAP: z.coerce.number().default(90),
  EMAIL_MONTHLY_CAP: z.coerce.number().default(2700),
  STORAGE_SOFT_LIMIT_GB: z.coerce.number().default(7.0),
  STORAGE_HARD_LIMIT_GB: z.coerce.number().default(9.5),
  TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  EXCHANGERATE_API_KEY: z.string().optional(),
  BACKUP_AGE_PUBLIC_KEY: z.string().optional(),
  SESSION_SECRET: z.string().default('wh_dev_session_secret_at_least_32_characters_long'),
  WEBAUTHN_RP_ID: z.string().default('localhost'),
  WEBAUTHN_RP_NAME: z.string().default('Wild Hills Real Estate'),
  WEBAUTHN_ORIGIN: z.string().default('http://localhost:3001'),
  COOKIE_SECRET: z.string().default('wh_dev_cookie_secret_at_least_32_characters_long'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid environment variables:', JSON.stringify(error.format(), null, 2));
  } else {
    console.error('Error parsing environment:', error);
  }
  throw new Error('Environment configuration validation failed');
}

export const env = parsedEnv;

