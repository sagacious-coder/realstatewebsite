import { uuidv7 } from 'uuidv7';
import {
  SubmissionCreate,
  SubmissionCreateSchema,
  SubmissionResponse,
} from '@wild-hills/contracts';
import { submissionsRepository } from '../repositories/submissions.repository.js';
import { leadsRepository } from '../repositories/leads.repository.js';
import { getCaptchaVerifier } from '../providers/index.js';
import { mintCapabilityToken } from '../auth/capability.js';
import { queueService } from './queue.service.js';

export interface SubmissionMetadata {
  ip?: string;
  userAgent?: string;
  idempotencyKey?: string;
  turnstileToken?: string;
}

export class SubmissionsService {
  async processSubmission(
    data: SubmissionCreate,
    metadata: SubmissionMetadata = {}
  ): Promise<SubmissionResponse> {
    // 1. Bot Defense: Verify Turnstile challenge token
    if (metadata.turnstileToken) {
      const verifier = getCaptchaVerifier();
      const captchaResult = await verifier.verifyToken(
        metadata.turnstileToken,
        metadata.ip
      );
      if (!captchaResult.success) {
        const error = new Error('Captcha challenge verification failed');
        (error as any).statusCode = 400;
        throw error;
      }
    }

    // 2. Idempotency Check
    if (metadata.idempotencyKey) {
      const existing = await leadsRepository.findIdempotency(
        metadata.idempotencyKey,
        '/v1/submissions'
      );
      if (existing) {
        return existing.responseBody as SubmissionResponse;
      }
    }

    // 3. Strict schema validation
    const parsed = SubmissionCreateSchema.parse(data);

    // 4. Generate UUID and Capability Token for seller tracking
    const submissionId = uuidv7();
    const capabilityToken = mintCapabilityToken(
      submissionId,
      parsed.sellerEmail
    );

    // 5. Persist submission in PostgreSQL with pending_review status
    const submission = await submissionsRepository.createSubmission({
      id: submissionId,
      sellerName: parsed.sellerName,
      sellerEmail: parsed.sellerEmail,
      sellerPhone: parsed.sellerPhone,
      countryCode: parsed.countryCode,
      city: parsed.city,
      area: parsed.area,
      propertyType: parsed.propertyType,
      bedrooms: parsed.bedrooms,
      bathrooms: String(parsed.bathrooms),
      sizeSqm: String(parsed.sizeSqm),
      expectedPriceMinor: parsed.expectedPriceMinor,
      currency: parsed.currency,
      description: parsed.description,
      notes: parsed.notes,
      status: 'pending_review',
      capabilityToken,
    });

    // 6. Enqueue asynchronous worker job 'submission.intake' via pg-boss
    await queueService.dispatch('submission.intake', {
      submissionId: submission.id,
      sellerEmail: submission.sellerEmail,
      sellerName: submission.sellerName,
      city: submission.city,
      countryCode: submission.countryCode,
      capabilityToken,
    });

    const trackingUrl = `/sell/status?token=${encodeURIComponent(capabilityToken)}`;

    const response: SubmissionResponse = {
      success: true,
      submissionId: submission.id,
      capabilityToken,
      trackingUrl,
      message:
        'Property submission registered successfully. You can monitor review progress using your private capability link.',
    };

    // 7. Store idempotency record
    if (metadata.idempotencyKey) {
      await leadsRepository.saveIdempotency(
        metadata.idempotencyKey,
        '/v1/submissions',
        201,
        response
      );
    }

    return response;
  }
}

export const submissionsService = new SubmissionsService();

