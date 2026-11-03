import { env } from '../config/env.js';
import { EmailProvider, MailpitEmailAdapter } from './email.js';
import { ObjectStorage, MinioStorageAdapter } from './storage.js';
import { FxProvider, FixtureFxAdapter } from './fx.js';
import {
  CaptchaVerifier,
  TurnstileDummyVerifier,
  CloudflareTurnstileVerifier,
} from './captcha.js';

export * from './email.js';
export * from './storage.js';
export * from './fx.js';
export * from './captcha.js';

let currentEmailProvider: EmailProvider = new MailpitEmailAdapter();
let currentStorageProvider: ObjectStorage = new MinioStorageAdapter();
let currentFxProvider: FxProvider = new FixtureFxAdapter();
let currentCaptchaVerifier: CaptchaVerifier =
  env.NODE_ENV === 'production' && env.TURNSTILE_SECRET_KEY
    ? new CloudflareTurnstileVerifier(env.TURNSTILE_SECRET_KEY)
    : new TurnstileDummyVerifier();

export function getEmailProvider(): EmailProvider {
  return currentEmailProvider;
}

export function setEmailProvider(provider: EmailProvider): void {
  currentEmailProvider = provider;
}

export function getStorageProvider(): ObjectStorage {
  return currentStorageProvider;
}

export function setStorageProvider(provider: ObjectStorage): void {
  currentStorageProvider = provider;
}

export function getFxProvider(): FxProvider {
  return currentFxProvider;
}

export function setFxProvider(provider: FxProvider): void {
  currentFxProvider = provider;
}

export function getCaptchaVerifier(): CaptchaVerifier {
  return currentCaptchaVerifier;
}

export function setCaptchaVerifier(verifier: CaptchaVerifier): void {
  currentCaptchaVerifier = verifier;
}
