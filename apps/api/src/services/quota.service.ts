import { env } from '../config/env.js';
import { usageRepository } from '../repositories/usage.repository.js';

export interface EmailScheduleDecision {
  canSendNow: boolean;
  skipDelivery: boolean; // e.g. P4 skipped when >70%
  scheduledFor?: Date;
  reason?: string;
}

export class QuotaService {
  private dailyCap = env.EMAIL_DAILY_CAP || 90;
  private monthlyCap = env.EMAIL_MONTHLY_CAP || 2700;
  private storageSoftLimitBytes = (env.STORAGE_SOFT_LIMIT_GB || 7.0) * 1024 * 1024 * 1024;
  private storageHardLimitBytes = (env.STORAGE_HARD_LIMIT_GB || 9.5) * 1024 * 1024 * 1024;

  /**
   * Evaluates email delivery throttling against daily quota and priority rules (Section 18.3).
   */
  async evaluateEmailPriority(
    priority: 'P1' | 'P2' | 'P3' | 'P4',
    now = new Date()
  ): Promise<EmailScheduleDecision> {
    const todayStr = now.toISOString().slice(0, 10);
    const counter = await usageRepository.getUsageForDate(todayStr);
    const todayCount = counter?.emailCount ?? 0;

    // 1. If at or exceeding the daily cap (e.g. >= 90), defer all emails to tomorrow
    if (todayCount >= this.dailyCap) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      return {
        canSendNow: false,
        skipDelivery: false,
        scheduledFor: tomorrow,
        reason: `Daily email cap reached (${todayCount}/${this.dailyCap}). Deferred to next day.`,
      };
    }

    // 2. If above 70% of the day's budget (e.g. >= 63), skip P4 visitor confirmations
    const threshold70 = Math.floor(this.dailyCap * 0.7);
    if (todayCount >= threshold70 && priority === 'P4') {
      return {
        canSendNow: false,
        skipDelivery: true,
        reason: `Budget above 70% (${todayCount}/${this.dailyCap}); skipping low-priority visitor confirmation.`,
      };
    }

    // 3. Otherwise, deliver immediately
    return {
      canSendNow: true,
      skipDelivery: false,
    };
  }

  /**
   * Verifies whether current storage usage allows a new file upload.
   * Throws an error or returns false if hard limit is breached.
   */
  async checkStorageQuota(incomingBytes = 0): Promise<{
    allowed: boolean;
    currentBytes: number;
    hardLimitBytes: number;
    softLimitReached: boolean;
  }> {
    const currentBytes = await usageRepository.getCurrentStorageBytes();
    const projectedBytes = currentBytes + incomingBytes;

    const softLimitReached = projectedBytes >= this.storageSoftLimitBytes;
    const allowed = projectedBytes < this.storageHardLimitBytes;

    return {
      allowed,
      currentBytes,
      hardLimitBytes: this.storageHardLimitBytes,
      softLimitReached,
    };
  }
}

export const quotaService = new QuotaService();
