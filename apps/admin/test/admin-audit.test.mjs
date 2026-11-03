import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nextConfig from '../next.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mirror of apps/admin/lib/csv.ts for runtime verification alongside source audit
function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

test('Admin Security: next.config.mjs enforces strict CSP, frame-ancestors none, HSTS, and X-Frame-Options DENY', async () => {
  const headerRules = await nextConfig.headers();
  assert.ok(Array.isArray(headerRules) && headerRules.length > 0, 'Expected headers array');
  const rootRule = headerRules.find((r) => r.source === '/:path*');
  assert.ok(rootRule, 'Expected /:path* header rule');

  const headerMap = new Map(rootRule.headers.map((h) => [h.key, h.value]));

  // Enforced CSP (not Report-Only)
  const csp = headerMap.get('Content-Security-Policy');
  assert.ok(csp, 'Content-Security-Policy header must be present and enforced');
  assert.ok(csp.includes("default-src 'self'"), 'CSP must enforce default-src self');
  assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP must enforce frame-ancestors none');
  assert.ok(csp.includes("object-src 'none'"), 'CSP must enforce object-src none');

  // HSTS, X-Frame-Options, nosniff, robots noindex
  assert.equal(headerMap.get('X-Frame-Options'), 'DENY');
  assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff');
  assert.ok(headerMap.get('Strict-Transport-Security')?.includes('max-age=63072000'));
  assert.ok(headerMap.get('X-Robots-Tag')?.includes('noindex'));
});

test('Admin Security: Formula injection defense neutralizes leading =, +, -, @ characters in CSV exports', () => {
  const csvSource = readFileSync(join(__dirname, '../lib/csv.ts'), 'utf-8');
  assert.ok(csvSource.includes('/^[=+\\-@\\t\\r]/'), 'lib/csv.ts must guard against =, +, -, @, \\t, \\r');

  // 1. Leading '=' formula attack
  assert.equal(sanitizeCsvValue('=cmd|"/C calc"!A0'), '"\'=cmd|""/C calc""!A0"');
  assert.equal(sanitizeCsvValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");

  // 2. Leading '+' formula attack
  assert.equal(sanitizeCsvValue('+cmd|"/C powershell"!A0'), '"\'+cmd|""/C powershell""!A0"');
  assert.equal(sanitizeCsvValue('+971506802332'), "'+971506802332");

  // 3. Leading '-' formula attack
  assert.equal(sanitizeCsvValue('-2+3+cmd|"/C calc"!A0'), '"\'-2+3+cmd|""/C calc""!A0"');

  // 4. Leading '@' formula attack
  assert.equal(sanitizeCsvValue('@SUM(1+1)*cmd|"/C calc"!A0'), '"\'@SUM(1+1)*cmd|""/C calc""!A0"');

  // 5. Normal strings and RFC 4180 escaping
  assert.equal(sanitizeCsvValue('WILD HILLS REAL ESTATE - L.L.C - S.P.C'), 'WILD HILLS REAL ESTATE - L.L.C - S.P.C');
  assert.equal(sanitizeCsvValue('Dubai, UAE'), '"Dubai, UAE"');
  assert.equal(sanitizeCsvValue(null), '');
  assert.equal(sanitizeCsvValue(undefined), '');
});

test('Admin Corporate Credentials: Official UAE licensing & contact details configured in data and settings', () => {
  const dataSource = readFileSync(join(__dirname, '../lib/data.ts'), 'utf-8');
  assert.ok(dataSource.includes('WILD HILLS REAL ESTATE - L.L.C - S.P.C'), 'Admin data must contain official Trade Name');
  assert.ok(dataSource.includes('walidward@gmail.com'), 'Admin data must contain official email');
  assert.ok(dataSource.includes('+971 50 680 2332'), 'Admin data must contain official mobile');

  const settingsSource = readFileSync(join(__dirname, '../app/settings/page.tsx'), 'utf-8');
  assert.ok(settingsSource.includes('101-2026-200113050'), 'Settings page must display Unified Registration No.');
  assert.ok(settingsSource.includes('501-2026-200074238'), 'Settings page must display Unified Licence No.');
});

