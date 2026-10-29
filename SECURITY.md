# Security Policy

## Reporting Security Issues

Wild Hills Real Estate takes security and data privacy seriously. If you discover a security vulnerability, please do NOT file a public issue.

Instead, please email: **security@wildhills.com** with:
- Description of the vulnerability
- Step-by-step instructions or PoC to reproduce
- Potential impact

We will acknowledge receipt within 24 hours and provide an estimated timeline for remediation.

## Security Baseline
- **Zero-trust layering:** Web, admin, and backend API run on isolated origins.
- **Strict Content Security Policy (CSP):** Enforced on admin and public web.
- **Passkeys & WebAuthn:** Mandatory MFA for all staff and administrative accounts.
- **Strict Input Validation:** All API inputs validate via Zod schemas (`.strict()`).
- **No Secrets in Client Code:** Environment isolation strictly prevents leakages.
