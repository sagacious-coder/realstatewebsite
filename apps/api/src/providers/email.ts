import { env } from '../config/env.js';

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  scheduledFor?: Date;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  success: boolean;
  timestamp: string;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  checkQuota(): Promise<{
    dailyUsed: number;
    dailyCap: number;
    monthlyUsed: number;
    monthlyCap: number;
  }>;
}

/**
 * Local development adapter routing emails to local Mailpit (or in-memory mock)
 */
export class MailpitEmailAdapter implements EmailProvider {
  private dailyUsed = 0;
  private monthlyUsed = 0;

  constructor(private mailpitApiUrl = 'http://localhost:8025/api/v1/send') {}

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const emailId = `mail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.dailyUsed += recipients.length;
    this.monthlyUsed += recipients.length;

    try {
      // In development, attempt delivering to Mailpit REST endpoint if reachable
      if (typeof fetch !== 'undefined') {
        await fetch(this.mailpitApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            From: { Email: options.from || 'noreply@wildhills.com', Name: 'Wild Hills' },
            To: recipients.map((r) => ({ Email: r })),
            Subject: options.subject,
            HTML: options.html,
            Text: options.text,
          }),
        }).catch(() => {
          // Fallback if Mailpit container is not running during unit tests
        });
      }
    } catch {
      // Silently fall through in mock mode
    }

    return {
      id: emailId,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  async checkQuota() {
    return {
      dailyUsed: this.dailyUsed,
      dailyCap: env.EMAIL_DAILY_CAP,
      monthlyUsed: this.monthlyUsed,
      monthlyCap: env.EMAIL_MONTHLY_CAP,
    };
  }
}
