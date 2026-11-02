import { createHmac, randomBytes } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a Base32 string (RFC 4648 without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i] ?? 0;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31] || '';
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31] || '';
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (!char) continue;
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random 20-byte Base32 TOTP secret.
 */
export function generateTotpSecret(bytes = 20): string {
  const buffer = randomBytes(bytes);
  return base32Encode(buffer);
}

/**
 * Generates standard otpauth URL for Google Authenticator / 1Password.
 */
export function getTotpUri(email: string, secret: string, issuer = 'Wild Hills'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes an RFC 6238 TOTP code for a given secret and timestamp.
 */
export function generateTotpCode(secret: string, timestampMs = Date.now(), stepSeconds = 30, digits = 6): string {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const key = base32Decode(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();

  // Dynamic truncation (RFC 4226)
  const lastByte = hmac[hmac.length - 1] ?? 0;
  const offset = lastByte & 0x0f;
  const b0 = hmac[offset] ?? 0;
  const b1 = hmac[offset + 1] ?? 0;
  const b2 = hmac[offset + 2] ?? 0;
  const b3 = hmac[offset + 3] ?? 0;

  const binaryCode =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  const otp = binaryCode % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Verifies a TOTP code against a secret with +/- clock drift window tolerance.
 */
export function verifyTotpCode(
  token: string,
  secret: string,
  window = 1,
  timestampMs = Date.now(),
  stepSeconds = 30,
  digits = 6
): boolean {
  if (!token || token.trim().length !== digits) {
    return false;
  }
  const cleanToken = token.trim();

  const currentCounter = Math.floor(timestampMs / 1000 / stepSeconds);

  for (let errorStep = -window; errorStep <= window; errorStep++) {
    const testTime = (currentCounter + errorStep) * stepSeconds * 1000;
    const expected = generateTotpCode(secret, testTime, stepSeconds, digits);
    if (cleanToken === expected) {
      return true;
    }
  }

  return false;
}
