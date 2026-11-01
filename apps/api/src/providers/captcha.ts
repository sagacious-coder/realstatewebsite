import { env } from '../config/env.js';

export interface VerifyCaptchaResult {
  success: boolean;
  hostname?: string;
  errorCodes?: string[];
  challengeTs?: string;
}

export interface CaptchaVerifier {
  verifyToken(token: string, remoteIp?: string): Promise<VerifyCaptchaResult>;
}

/**
 * Cloudflare Turnstile local dummy verifier accepting official test sitekeys/tokens:
 * - 1x00000000000000000000AA: Always passes
 * - 2x00000000000000000000AB: Always fails
 * - Any non-empty string in development/test passes
 */
export class TurnstileDummyVerifier implements CaptchaVerifier {
  async verifyToken(token: string, _remoteIp?: string): Promise<VerifyCaptchaResult> {
    if (!token || token.trim() === '') {
      return {
        success: false,
        errorCodes: ['missing-input-response'],
      };
    }

    if (token === '2x00000000000000000000AB' || token === 'FAIL') {
      return {
        success: false,
        errorCodes: ['invalid-input-response'],
      };
    }

    // Always passes for standard dummy token or in dev
    return {
      success: true,
      hostname: 'localhost',
      challengeTs: new Date().toISOString(),
    };
  }
}

/**
 * Production Cloudflare Turnstile adapter
 */
export class CloudflareTurnstileVerifier implements CaptchaVerifier {
  constructor(private secretKey = env.TURNSTILE_SECRET_KEY) {}

  async verifyToken(token: string, remoteIp?: string): Promise<VerifyCaptchaResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = (await res.json()) as {
        success: boolean;
        hostname?: string;
        'error-codes'?: string[];
        challenge_ts?: string;
      };

      return {
        success: data.success,
        hostname: data.hostname,
        errorCodes: data['error-codes'],
        challengeTs: data.challenge_ts,
      };
    } catch {
      return {
        success: false,
        errorCodes: ['internal-verification-error'],
      };
    }
  }
}
