import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('Web Security: next.config.mjs enforces Content-Security-Policy, frame-ancestors none, HSTS, and X-Frame-Options DENY', () => {
  const configSource = readFileSync(join(__dirname, '../next.config.mjs'), 'utf-8');

  // Verify CSP is enforced (not Report-Only)
  assert.ok(configSource.includes("key: 'Content-Security-Policy'"), 'Must use enforced Content-Security-Policy header key');
  assert.ok(!configSource.includes("key: 'Content-Security-Policy-Report-Only'"), 'Must not use Report-Only CSP in production');
  assert.ok(configSource.includes("default-src 'self'"), 'CSP must include default-src self');
  assert.ok(configSource.includes("frame-ancestors 'none'"), 'CSP must include frame-ancestors none');
  assert.ok(configSource.includes("object-src 'none'"), 'CSP must include object-src none');

  // Verify HSTS, X-Frame-Options, nosniff, Referrer-Policy
  assert.ok(configSource.includes("key: 'X-Frame-Options'") && configSource.includes("value: 'DENY'"), 'Must enforce X-Frame-Options DENY');
  assert.ok(configSource.includes("key: 'X-Content-Type-Options'") && configSource.includes("value: 'nosniff'"), 'Must enforce X-Content-Type-Options nosniff');
  assert.ok(configSource.includes("key: 'Strict-Transport-Security'") && configSource.includes('max-age=63072000; includeSubDomains; preload'), 'Must enforce HSTS');
});

test('Web Corporate Credentials: Official UAE licensing & contact details present in site-config, Footer, WhatsApp, and i18n messages', () => {
  const siteConfig = readFileSync(join(__dirname, '../lib/site-config.ts'), 'utf-8');
  assert.ok(siteConfig.includes('WILD HILLS REAL ESTATE - L.L.C - S.P.C'), 'site-config must include Trade Name (EN)');
  assert.ok(siteConfig.includes('وايلد هيلز للعقارات - ذ.م.م - ش.ش.و'), 'site-config must include Trade Name (AR)');
  assert.ok(siteConfig.includes('101-2026-200113050'), 'site-config must include Unified Registration No.');
  assert.ok(siteConfig.includes('501-2026-200074238'), 'site-config must include Unified Licence No.');
  assert.ok(siteConfig.includes('walidward@gmail.com'), 'site-config must include official email');
  assert.ok(siteConfig.includes('+971 50 680 2332'), 'site-config must include official phone');
  assert.ok(siteConfig.includes('https://wa.me/971506802332'), 'site-config must include WhatsApp URL');

  const footer = readFileSync(join(__dirname, '../components/layout/Footer.tsx'), 'utf-8');
  assert.ok(footer.includes('UAE_CORPORATE_CREDENTIALS'), 'Footer must render UAE_CORPORATE_CREDENTIALS');
  assert.ok(footer.includes("footer.corporate.tradeName"), 'Footer must render localized tradeName');
  assert.ok(footer.includes("footer.corporate.unifiedLicenceLabel"), 'Footer must render unifiedLicenceLabel');

  const whatsappBtn = readFileSync(join(__dirname, '../components/WhatsAppButton.tsx'), 'utf-8');
  assert.ok(whatsappBtn.includes('+971 50 680 2332'), 'WhatsAppButton default phone must be +971 50 680 2332');

  const sidebar = readFileSync(join(__dirname, '../components/property/PropertyInquirySidebar.tsx'), 'utf-8');
  assert.ok(sidebar.includes('+971 50 680 2332') && sidebar.includes('971506802332'), 'PropertyInquirySidebar must use official UAE fallback contact');

  const enMessages = JSON.parse(readFileSync(join(__dirname, '../messages/en.json'), 'utf-8'));
  const arMessages = JSON.parse(readFileSync(join(__dirname, '../messages/ar.json'), 'utf-8'));

  assert.equal(enMessages.shell.footer.corporate.tradeName, 'WILD HILLS REAL ESTATE - L.L.C - S.P.C');
  assert.equal(enMessages.shell.footer.corporate.unifiedLicenceNo, '501-2026-200074238');
  assert.equal(enMessages.shell.footer.corporate.unifiedRegistrationNo, '101-2026-200113050');

  assert.equal(arMessages.shell.footer.corporate.tradeName, 'وايلد هيلز للعقارات - ذ.م.م - ش.ش.و');
  assert.equal(arMessages.shell.footer.corporate.unifiedLicenceNo, '501-2026-200074238');
  assert.equal(arMessages.shell.footer.corporate.unifiedRegistrationNo, '101-2026-200113050');
});

