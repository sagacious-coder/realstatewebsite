import type { FastifyPluginAsync } from 'fastify';
import {
  LeadCreateSchema,
  LeadResponseSchema,
  SubmissionCreateSchema,
  SubmissionResponseSchema,
  UploadPresignRequestSchema,
  UploadPresignResponseSchema,
  ProblemDetailsSchema,
} from '@wild-hills/contracts';
import { leadsService } from '../services/leads.service.js';
import { submissionsService } from '../services/submissions.service.js';
import { uploadsService } from '../services/uploads.service.js';

export const leadsRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Inbound Leads Intake (POST /leads)
  fastify.post(
    '/leads',
    {
      config: {
        audience: 'public',
        permission: 'public:create_lead',
        rateLimitClass: 'standard',
      },
      schema: {
        summary: 'Submit property lead or inquiry',
        description: 'Captures general inquiries, viewing bookings, and property leads with bot defense and idempotency.',
        tags: ['Leads'],
        body: LeadCreateSchema,
        response: {
          201: LeadResponseSchema,
          400: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const idempotencyKey =
        (request.headers['idempotency-key'] as string) ||
        (request.headers['x-idempotency-key'] as string);

      const turnstileToken =
        (request.headers['cf-turnstile-response'] as string) ||
        (request.headers['x-turnstile-token'] as string);

      const honeypot = request.headers['x-honeypot'] as string | undefined;
      const fillTimeRaw = request.headers['x-fill-time'] as string | undefined;
      const fillTimeMs = fillTimeRaw ? parseInt(fillTimeRaw, 10) : undefined;

      const result = await leadsService.processLead(request.body as any, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        idempotencyKey,
        turnstileToken,
        honeypot,
        fillTimeMs,
      });

      return reply.status(201).send(result);
    }
  );

  // 2. Seller Submissions Intake (POST /submissions)
  fastify.post(
    '/submissions',
    {
      config: {
        audience: 'public',
        permission: 'public:create_submission',
        rateLimitClass: 'standard',
      },
      schema: {
        summary: 'Submit property for sale',
        description: 'Seller submission form for homeowners looking to list with Wild Hills, issuing a private capability tracking token.',
        tags: ['Submissions'],
        body: SubmissionCreateSchema,
        response: {
          201: SubmissionResponseSchema,
          400: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const idempotencyKey =
        (request.headers['idempotency-key'] as string) ||
        (request.headers['x-idempotency-key'] as string);

      const turnstileToken =
        (request.headers['cf-turnstile-response'] as string) ||
        (request.headers['x-turnstile-token'] as string);

      const result = await submissionsService.processSubmission(
        request.body as any,
        {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          idempotencyKey,
          turnstileToken,
        }
      );

      return reply.status(201).send(result);
    }
  );

  // 3. Presigned Upload URL Generator (POST /uploads/presign)
  fastify.post(
    '/uploads/presign',
    {
      config: {
        audience: 'public',
        permission: 'public:presign_upload',
        rateLimitClass: 'upload',
      },
      schema: {
        summary: 'Generate presigned upload URL',
        description: 'Request a presigned S3 upload URL for property photos, floor plans, or verification documents.',
        tags: ['Uploads'],
        body: UploadPresignRequestSchema,
        response: {
          200: UploadPresignResponseSchema,
          400: ProblemDetailsSchema,
          403: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await uploadsService.presignUpload(request.body as any);
      return reply.status(200).send(result);
    }
  );
};

