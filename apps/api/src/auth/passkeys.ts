import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { env } from '../config/env.js';

export interface PasskeyRecord {
  id: string; // Base64URL credential ID
  publicKey: string; // Base64URL string or binary string
  counter: number;
  deviceType?: string | null;
  backedUp?: boolean;
  transports?: string[];
}

export interface WebAuthnUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Generates options for a user registering a new WebAuthn / FIDO2 passkey.
 */
export async function getPasskeyRegistrationOptions(
  user: WebAuthnUser,
  existingPasskeys: PasskeyRecord[] = [],
  rpID = env.WEBAUTHN_RP_ID,
  rpName = env.WEBAUTHN_RP_NAME
) {
  // Convert user id to Uint8Array for WebAuthn binary user handle
  const userIdBuffer = Buffer.from(user.id, 'utf-8');

  return await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new Uint8Array(userIdBuffer),
    userName: user.email,
    userDisplayName: user.name || user.email,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.id,
      transports: pk.transports as any,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
}

/**
 * Checks if the counter indicates a cloned or rolled-back authenticator.
 */
export function isAuthenticatorClone(storedCounter: number, newCounter: number): boolean {
  return storedCounter > 0 && newCounter <= storedCounter;
}

/**
 * Verifies a passkey registration response and extracts public key and counter.
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string = env.WEBAUTHN_ORIGIN,
  expectedRPID: string = env.WEBAUTHN_RP_ID
) {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: [expectedOrigin, 'http://localhost:3000', 'http://localhost:3001'],
      expectedRPID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false, error: 'Registration verification failed' };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    return {
      verified: true,
      registrationInfo: {
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: response.response.transports || [],
      },
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || 'Registration verification failed',
    };
  }
}

/**
 * Generates options for authenticating via passkey (assertion challenge).
 */
export async function getPasskeyAuthenticationOptions(
  allowPasskeys?: PasskeyRecord[],
  rpID = env.WEBAUTHN_RP_ID
) {
  return await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowPasskeys?.map((pk) => ({
      id: pk.id,
      transports: pk.transports as any,
    })),
    userVerification: 'preferred',
  });
}

/**
 * Verifies a passkey assertion response and performs counter rollback / clone detection.
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  passkey: PasskeyRecord,
  expectedOrigin: string = env.WEBAUTHN_ORIGIN,
  expectedRPID: string = env.WEBAUTHN_RP_ID
) {
  try {
    // Decode public key from base64url
    const publicKeyBuffer = Buffer.from(passkey.publicKey, 'base64url');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: [expectedOrigin, 'http://localhost:3000', 'http://localhost:3001'],
      expectedRPID,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(publicKeyBuffer),
        counter: passkey.counter,
        transports: passkey.transports as any,
      },
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return { verified: false, error: 'Authentication assertion failed' };
    }

    const { newCounter } = verification.authenticationInfo;

    // Counter verification: detect cloned authenticators
    if (isAuthenticatorClone(passkey.counter, newCounter)) {
      return {
        verified: false,
        error: 'Authenticator counter did not increase; potential cloned authenticator detected',
      };
    }

    return {
      verified: true,
      newCounter,
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || 'Authentication assertion failed',
    };
  }
}
