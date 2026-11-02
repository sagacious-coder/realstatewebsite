import { randomBytes, createHash } from 'node:crypto';

export interface RecoveryCodePair {
  code: string;
  hash: string;
}

/**
 * Hashes an emergency recovery code for secure database persistence.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return createHash('sha256').update(`wh_recovery:${normalized}`).digest('hex');
}

/**
 * Generates an array of single-use emergency backup recovery codes.
 * Returns formatted plaintext codes (for user display once) and SHA-256 hashes (for storage).
 */
export function generateRecoveryCodes(count = 10): { codes: string[]; pairs: RecoveryCodePair[] } {
  const codes: string[] = [];
  const pairs: RecoveryCodePair[] = [];

  for (let i = 0; i < count; i++) {
    // 8 bytes -> 16 hex chars grouped as XXXX-XXXX-XXXX-XXXX
    const raw = randomBytes(8).toString('hex').toUpperCase();
    const formatted = `WH-${raw.substring(0, 4)}-${raw.substring(4, 8)}-${raw.substring(8, 12)}`;
    const hash = hashRecoveryCode(formatted);

    codes.push(formatted);
    pairs.push({ code: formatted, hash });
  }

  return { codes, pairs };
}

/**
 * Validates a recovery code input format.
 */
export function isValidRecoveryCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized.length >= 12;
}

