import { hash, verify } from '@node-rs/argon2';

export interface Argon2Options {
  memoryCost?: number;
  timeCost?: number;
  outputLen?: number;
  parallelism?: number;
}

// OWASP recommended parameters for Argon2id
const DEFAULT_OPTIONS: Argon2Options = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(password: string, options: Argon2Options = DEFAULT_OPTIONS): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await hash(password, options);
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  if (!hashString || !password) {
    return false;
  }
  try {
    return await verify(hashString, password);
  } catch {
    return false;
  }
}

