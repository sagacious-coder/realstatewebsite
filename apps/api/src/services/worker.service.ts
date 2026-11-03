import sharp from 'sharp';
import pino from 'pino';
import { env } from '../config/env.js';
import { REDACTED_PATHS } from '../plugins/logging.js';
import { getEmailProvider, getStorageProvider, getFxProvider } from '../providers/index.js';
import { leadsRepository } from '../repositories/leads.repository.js';
import { submissionsRepository } from '../repositories/submissions.repository.js';
import { usageRepository } from '../repositories/usage.repository.js';
import { ratesRepository } from '../repositories/rates.repository.js';
import { quotaService } from './quota.service.js';

const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
});

export class WorkerService {
  /**
   * Processes inbound lead: dispatches P1 alert to concierge and P4 confirmation to client.
   */
  async handleLeadIntake(data: {
    leadId: string;
    email?: string;
    name?: string;
    countryCode?: string;
    propertyRef?: string;
    message?: string;
  }): Promise<{ staffEmailSent: boolean; visitorEmailSent: boolean; deferred: boolean }> {
    logger.info({ leadId: data.leadId }, 'Processing lead.intake job');

    const lead = await leadsRepository.findLeadById(data.leadId);
    if (!lead) {
      logger.warn({ leadId: data.leadId }, 'Lead record not found in database');
      return { staffEmailSent: false, visitorEmailSent: false, deferred: false };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const emailProvider = getEmailProvider();
    let staffEmailSent = false;
    let visitorEmailSent = false;
    let deferred = false;

    // 1. Staff Concierge Alert (Priority P1)
    const p1Decision = await quotaService.evaluateEmailPriority('P1');
    if (p1Decision.canSendNow) {
      const staffHtml = `
        <h2>New Property Inquiry</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Country:</strong> ${lead.countryCode.toUpperCase()}</p>
        <p><strong>Target Ref:</strong> ${lead.propertyRef || 'General'}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${lead.message || 'No additional message provided.'}</blockquote>
      `;

      await emailProvider.sendEmail({
        to: 'concierge@wildhills.com',
        subject: `[New Lead] ${lead.name} - ${lead.countryCode.toUpperCase()}`,
        html: staffHtml,
        priority: 'P1',
      });

      await usageRepository.insertEmailOutbox({
        recipient: 'concierge@wildhills.com',
        subject: `[New Lead] ${lead.name}`,
        html: staffHtml,
        priority: 'P1',
        status: 'sent',
        sentAt: new Date(),
      });

      await usageRepository.incrementEmailCount(todayStr, 1);
      staffEmailSent = true;
    } else if (p1Decision.scheduledFor) {
      deferred = true;
      await usageRepository.insertEmailOutbox({
        recipient: 'concierge@wildhills.com',
        subject: `[New Lead] ${lead.name}`,
        html: 'Deferred P1 lead alert',
        priority: 'P1',
        status: 'deferred',
        scheduledFor: p1Decision.scheduledFor,
      });
    }

    // 2. Client Auto-Responder Confirmation (Priority P4)
    const p4Decision = await quotaService.evaluateEmailPriority('P4');
    if (p4Decision.canSendNow && !p4Decision.skipDelivery) {
      const clientHtml = `
        <h2>Thank you for contacting Wild Hills</h2>
        <p>Dear ${lead.name},</p>
        <p>We have received your inquiry regarding luxury properties in ${lead.countryCode.toUpperCase()}.</p>
        <p>A dedicated private client advisor will connect with you via ${lead.preferredContact} within 24 hours.</p>
        <p>Warm regards,<br>The Wild Hills Team</p>
      `;

      await emailProvider.sendEmail({
        to: lead.email,
        subject: 'Thank you for contacting Wild Hills Real Estate',
        html: clientHtml,
        priority: 'P4',
      });

      await usageRepository.insertEmailOutbox({
        recipient: lead.email,
        subject: 'Thank you for contacting Wild Hills Real Estate',
        html: clientHtml,
        priority: 'P4',
        status: 'sent',
        sentAt: new Date(),
      });

      await usageRepository.incrementEmailCount(todayStr, 1);
      visitorEmailSent = true;
    } else if (p4Decision.skipDelivery) {
      logger.info({ leadId: lead.id }, 'Skipping P4 client confirmation due to 70% daily quota threshold');
    }

    return { staffEmailSent, visitorEmailSent, deferred };
  }

  /**
   * Processes seller submission: dispatches P1 alert to review queue and P3 tracking link to seller.
   */
  async handleSubmissionIntake(data: {
    submissionId: string;
    capabilityToken?: string;
  }): Promise<{ staffEmailSent: boolean; sellerEmailSent: boolean; deferred: boolean }> {
    logger.info({ submissionId: data.submissionId }, 'Processing submission.intake job');

    const submission = await submissionsRepository.findSubmissionById(data.submissionId);
    if (!submission) {
      logger.warn({ submissionId: data.submissionId }, 'Submission record not found in database');
      return { staffEmailSent: false, sellerEmailSent: false, deferred: false };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const emailProvider = getEmailProvider();
    const token = data.capabilityToken || submission.capabilityToken;
    let staffEmailSent = false;
    let sellerEmailSent = false;
    let deferred = false;

    // 1. Staff Review Queue Alert (Priority P1)
    const p1Decision = await quotaService.evaluateEmailPriority('P1');
    if (p1Decision.canSendNow) {
      const staffHtml = `
        <h2>New Property Submission for Review</h2>
        <p><strong>Seller:</strong> ${submission.sellerName}</p>
        <p><strong>Email:</strong> ${submission.sellerEmail}</p>
        <p><strong>Phone:</strong> ${submission.sellerPhone}</p>
        <p><strong>Location:</strong> ${submission.city}, ${submission.countryCode.toUpperCase()}</p>
        <p><strong>Type:</strong> ${submission.propertyType}</p>
        <p><strong>Expected Price:</strong> ${submission.expectedPriceMinor} (minor units) ${submission.currency}</p>
      `;

      await emailProvider.sendEmail({
        to: 'admin@wildhills.com',
        subject: `[New Submission] ${submission.sellerName} - ${submission.city}`,
        html: staffHtml,
        priority: 'P1',
      });

      await usageRepository.insertEmailOutbox({
        recipient: 'admin@wildhills.com',
        subject: `[New Submission] ${submission.sellerName} - ${submission.city}`,
        html: staffHtml,
        priority: 'P1',
        status: 'sent',
        sentAt: new Date(),
      });

      await usageRepository.incrementEmailCount(todayStr, 1);
      staffEmailSent = true;
    }

    // 2. Seller Confirmation with Capability Link (Priority P3)
    const p3Decision = await quotaService.evaluateEmailPriority('P3');
    if (p3Decision.canSendNow && token) {
      const trackingUrl = `https://wildhills.com/sell/status?token=${encodeURIComponent(token)}`;
      const sellerHtml = `
        <h2>Your Property Submission Received</h2>
        <p>Dear ${submission.sellerName},</p>
        <p>Thank you for submitting your property in ${submission.city} to Wild Hills.</p>
        <p>Our editorial team is reviewing your listing details and media.</p>
        <p>You can check your submission review status at any time using your private tracking link:</p>
        <p><a href="${trackingUrl}">${trackingUrl}</a></p>
        <p>Warm regards,<br>The Wild Hills Team</p>
      `;

      await emailProvider.sendEmail({
        to: submission.sellerEmail,
        subject: 'Your property submission to Wild Hills',
        html: sellerHtml,
        priority: 'P3',
      });

      await usageRepository.insertEmailOutbox({
        recipient: submission.sellerEmail,
        subject: 'Your property submission to Wild Hills',
        html: sellerHtml,
        priority: 'P3',
        status: 'sent',
        sentAt: new Date(),
      });

      await usageRepository.incrementEmailCount(todayStr, 1);
      sellerEmailSent = true;
    } else if (p3Decision.scheduledFor) {
      deferred = true;
    }

    return { staffEmailSent, sellerEmailSent, deferred };
  }

  /**
   * Processes uploaded media: verifies in S3, strips EXIF, converts to WebP with Sharp, updates storage counter.
   */
  async handleMediaProcess(data: {
    key: string;
    bucket?: string;
    contentType?: string;
    submissionId?: string;
    listingId?: string;
  }): Promise<{ processedKey: string; sizeBytes: number; isWebP: boolean }> {
    logger.info({ key: data.key }, 'Processing media.process job');

    const bucket = data.bucket || env.S3_BUCKET_PUBLIC || 'wildhills-media';
    const storage = getStorageProvider();
    const object = await storage.getObject(bucket, data.key);

    let processedBuffer = object.body;
    let processedContentType = object.contentType || data.contentType || 'application/octet-stream';
    let processedKey = data.key;
    let isWebP = false;

    // If file is an image, perform EXIF stripping and WebP compression
    if (processedContentType.startsWith('image/')) {
      try {
        const image = sharp(object.body);
        // .rotate() auto-orients based on EXIF and removes other personal EXIF data
        processedBuffer = await image
          .rotate()
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        // Enforce 250 KB budget from Section 18.3
        if (processedBuffer.length > 250 * 1024) {
          processedBuffer = await image
            .rotate()
            .webp({ quality: 65, effort: 4 })
            .toBuffer();
        }

        processedContentType = 'image/webp';
        processedKey = data.key.replace(/\.[^.]+$/, '.webp');
        isWebP = true;

        // Write processed WebP back to storage
        await storage.putObject({
          bucket,
          key: processedKey,
          body: processedBuffer,
          contentType: 'image/webp',
        });
      } catch (err) {
        logger.warn({ err, key: data.key }, 'Sharp processing failed, falling back to original buffer');
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const sizeBytes = processedBuffer.length;

    // Record size in usage counters
    await usageRepository.updateStorageBytes(sizeBytes, todayStr);

    // If associated with a submission, link document record
    if (data.submissionId) {
      const fileName = data.key.split('/').pop() || 'upload.webp';
      const fileUrl = `https://${env.IMAGE_CDN_HOST || 'media.wildhills.example'}/${processedKey}`;

      await submissionsRepository.createSubmissionDocument({
        submissionId: data.submissionId,
        fileName,
        fileUrl,
        fileSizeBytes: sizeBytes,
        contentType: processedContentType,
      });
    }

    return { processedKey, sizeBytes, isWebP };
  }

  /**
   * Refreshes foreign exchange rates daily and preserves last good rates.
   */
  async handleFxRefresh(): Promise<boolean> {
    logger.info('Processing fx.refresh job');
    try {
      const fxProvider = getFxProvider();
      const res = await fxProvider.getRates('USD');
      const rates = res.rates;
      if (rates && Object.keys(rates).length > 0) {
        await ratesRepository.updateRates('USD', rates);
        logger.info('FX rates updated successfully in database');
        return true;
      }
    } catch (err) {
      logger.error({ err }, 'Failed to refresh FX rates; keeping last good rates');
    }
    return false;
  }
}

export const workerService = new WorkerService();
