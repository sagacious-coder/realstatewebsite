import {
  LeadCreate,
  LeadCreateSchema,
  LeadResponse,
} from '@wild-hills/contracts';
import { leadsRepository } from '../repositories/leads.repository.js';
import { getCaptchaVerifier } from '../providers/index.js';
import { queueService } from './queue.service.js';

export interface LeadSubmissionMetadata {
  ip?: string;
  userAgent?: string;
  idempotencyKey?: string;
  turnstileToken?: string;
  honeypot?: string;
  fillTimeMs?: number;
}

export class LeadsService {
  async processLead(
    data: LeadCreate,
    metadata: LeadSubmissionMetadata = {}
  ): Promise<LeadResponse> {
    // 1. Honeypot check: reject bot silently
    if (metadata.honeypot && metadata.honeypot.trim().length > 0) {
      return {
        success: true,
        leadId: 'lead_bot_discarded',
        message: 'Thank you for your inquiry.',
      };
    }

    // 2. Fill-time check: human forms require at least 800ms
    if (metadata.fillTimeMs !== undefined && metadata.fillTimeMs < 800) {
      return {
        success: true,
        leadId: 'lead_fast_discarded',
        message: 'Thank you for your inquiry.',
      };
    }

    // 3. Bot Defense: Verify Turnstile challenge token
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

    // 4. Idempotency Check: prevent duplicate submissions
    if (metadata.idempotencyKey) {
      const existing = await leadsRepository.findIdempotency(
        metadata.idempotencyKey,
        '/v1/leads'
      );
      if (existing) {
        return existing.responseBody as LeadResponse;
      }
    }

    // 5. Strict schema validation
    const parsed = LeadCreateSchema.parse(data);

    // 6. Persistence in PostgreSQL
    const newLead = await leadsRepository.createLead({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      countryCode: parsed.countryCode,
      type: parsed.type,
      status: 'new',
      listingId: parsed.listingId,
      propertyRef: parsed.propertyRef,
      budgetMin: parsed.budgetMin,
      budgetMax: parsed.budgetMax,
      currency: parsed.currency,
      message: parsed.message,
      locale: parsed.locale,
      preferredContact: parsed.preferredContact,
      consentGiven: parsed.consentGiven,
    });

    // 7. Enqueue asynchronous worker job 'lead.intake' via pg-boss / queueService
    await queueService.dispatch('lead.intake', {
      leadId: newLead.id,
      email: newLead.email,
      name: newLead.name,
      countryCode: newLead.countryCode,
      propertyRef: newLead.propertyRef,
      message: newLead.message,
    });

    const response: LeadResponse = {
      success: true,
      leadId: newLead.id,
      message:
        'Thank you for your inquiry. A Wild Hills private advisor will reach out shortly.',
    };

    // 8. Store idempotency record
    if (metadata.idempotencyKey) {
      await leadsRepository.saveIdempotency(
        metadata.idempotencyKey,
        '/v1/leads',
        201,
        response
      );
    }

    return response;
  }
}

export const leadsService = new LeadsService();
