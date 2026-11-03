# Wild Hills Real Estate Portal — Production Launch Checklist (Stage 14)

**Company Entity:** `WILD HILLS REAL ESTATE - L.L.C - S.P.C` (`وايلد هيلز للعقارات - ذ.م.م - ش.ش.و`)  
**Unified Registration No.:** `101-2026-200113050` | **Unified Licence No.:** `501-2026-200074238`  
**Current Privacy Mode:** `SITE_PRIVATE=true` (Pre-Launch Gate Active — `robots.txt` serves `Disallow: /` and `X-Robots-Tag: noindex, nofollow` until Owner sign-off)

---

## 17.1 Infrastructure & Security (Lean Free Mode — Section 18)

| # | Requirement | Status | Verification / Notes |
|---|---|---|---|
| 1 | **Zero Paid SaaS Dependencies** (other than VPS host & domain) | **Done** | Verified against Section 18.5 & 18.7. Uses PostgreSQL 16 in Docker, `pg-boss`, Cloudflare R2 Free Tier, Resend Free Tier, Cloudflare Turnstile Free, ExchangeRate-API Free, and OpenStreetMap/Leaflet. |
| 2 | **Database Isolated from Public Internet** (Section 18.4 Item 1) | **Done** | Verified in `infra/docker-compose.prod.yml` and `apps/api/test/stage14-e2e.test.ts` (`Test 3.1`). `postgres` service binds exclusively to `wh_internal` bridge network with no host `ports:` published. |
| 3 | **Database Least-Privilege & RLS Enforcement** (Section 10.6 & 10.8) | **Done** | Verified in `stage14-e2e.test.ts` (`Tests 1.2 & 1.3`). `wh_public_ro` cannot `INSERT`/`UPDATE`/`DELETE` on any table or view; scoped staff cannot read/write outside their assigned `country_scopes`. |
| 4 | **Enforced CSP, HSTS, `frame-ancestors 'none'`, & `__Host-` Cookies** | **Done** | Verified across `apps/web/next.config.mjs`, `apps/admin/next.config.mjs`, `apps/api/src/plugins/security.ts`, and `infra/Caddyfile`. Tested in `stage14-e2e.test.ts`, `web-audit.test.mjs`, and `admin-audit.test.mjs`. |
| 5 | **Secret & PII Redaction in Structured Logs** | **Done** | Verified in `apps/api/src/plugins/logging.ts` (`REDACTED_PATHS`) and tested in `stage14-e2e.test.ts` (`Test 1.4`). Redacts passwords, session tokens, capability tokens, cookies, and customer PII. |
| 6 | **Formula Injection Guard on CSV Exports** | **Done** | Verified in `apps/api/src/services/admin.service.ts` and `apps/admin/lib/csv.ts` (`=`, `+`, `-`, `@`, `\t`, `\r` neutralization). Tested in `stage14-e2e.test.ts` and `admin-audit.test.mjs`. |
| 7 | **Nightly Encrypted Backups (`age` + `pg_dump -Fc`) & Clean Restore Test** | **Done** | `scripts/backup-db.sh` implemented and verified; 1-page restore runbook documented at [`docs/runbooks/restore-database.md`](docs/runbooks/restore-database.md); clean-instance restore test passed in `stage14-e2e.test.ts` (`Test 3.2`). |
| 8 | **Production Secrets Provisioned on Host (`chmod 600 .env`)** | **Needs Owner Input** | Copy `.env.example` to `/opt/wild-hills/.env` (`chmod 600`), rotate dev keys (`SESSION_SECRET`, `CAPABILITY_TOKEN_SECRET`, `POSTGRES_PASSWORD`), and set `BACKUP_AGE_PUBLIC_KEY`. |
| 9 | **Cloudflare DNS, TLS (Full Strict), WAF & Production Turnstile Keys** | **Needs Owner Input** | Point `wildhills.com`, `admin.wildhills.com`, and `api.wildhills.com` to VPS IP; enable Cloudflare Free WAF rate-limit rule on `/v1/public/leads` & `/v1/auth/*`; create production Turnstile widget. |
| 10 | **Resend Domain Verification (SPF, DKIM, DMARC) & Email Budget Caps** | **Needs Owner Input** | Verify sending domain in Resend dashboard. Code-level caps (`EMAIL_DAILY_CAP=90`, `EMAIL_MONTHLY_CAP=2700`, P1–P4 priority degradation) are **Done** and verified in `apps/api`. |
| 11 | **Free Uptime Monitor Configured (Better Stack Free Tier)** | **Needs Owner Input** | Configure 3-minute HTTP checks on `https://wildhills.com` and `https://api.wildhills.com/v1/internal/healthz` alerting `walidward@gmail.com` / `+971 50 680 2332`. |

---

## 17.2 Legal & Content (Owner Sign-Off)

| # | Requirement | Status | Verification / Notes |
|---|---|---|---|
| 1 | **Official UAE Corporate Licensing & Contact Credentials** | **Done** | Verified across `apps/web`, `apps/admin`, `apps/api`, and `packages/contracts`: `WILD HILLS REAL ESTATE - L.L.C - S.P.C` (`وايلد هيلز للعقارات - ذ.م.م - ش.ش.و`), Unified Reg `101-2026-200113050`, Unified Licence `501-2026-200074238`, `walidward@gmail.com`, `+971 50 680 2332` (`https://wa.me/971506802332`). |
| 2 | **Sample Listings & Sample Developer Flags Addressed** | **Done** | `isSample` flag enforced across database schema, contracts, and UI components; `trg_publish_guard` database trigger enforces required fields before any listing transitions to `published`. |
| 3 | **Image Licensing & High-DPI Retina Audit** | **Done** | Master WebP assets audited in `CREDITS.md` and `apps/web/public/images/`; GPU hardware-accelerated hover transitions verified across all cards. |
| 4 | **Final Owner Review of Terms, Privacy Policy, & Country Guides** | **Needs Owner Input** | Legal & commercial sign-off on `/terms`, `/privacy`, `/cookies`, and country buying guides (`/ae/guide`, `/tr/guide`, `/ge/guide`, `/eg/guide`). |
| 5 | **Native Arabic Copy Sign-Off** | **Needs Owner Input** | Final editorial review of `apps/web/messages/ar.json` and Arabic property descriptions before public indexing. |

---

## 17.3 Launch Cutover Procedure

> **IMPORTANT:** Per Stage 14 safety rules, `SITE_PRIVATE=true` remains active in defaults until all "Needs Owner Input" items above are signed off.

1. **Flip Public Indexing Gate:**
   - Set `SITE_PRIVATE=false` and `NEXT_PUBLIC_SITE_PRIVATE=false` in the production `.env` file.
   - Redeploy stack: `docker compose -f infra/docker-compose.prod.yml up -d --build`.
2. **Verify Public SEO Endpoints:**
   - Confirm `https://wildhills.com/robots.txt` returns `Allow: /` and references `https://wildhills.com/sitemap.xml`.
   - Confirm response headers no longer include `X-Robots-Tag: noindex, nofollow`.
3. **Search Engine Submission:**
   - Submit `https://wildhills.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
4. **14-Day Hypercare Window:**
   - Monitor `/v1/internal/healthz`, `audit_events`, email daily cap utilization, and Core Web Vitals for the first 14 days post-launch.

---

## 17.4 Post-Launch Upgrade Triggers (When to Start Paying)

Stay on **Lean Free Mode** until a concrete revenue/volume trigger fires:

| Trigger | Recommended Upgrade | Estimated Cost (Oct 2026 ref) |
|---|---|---|
| > 80 transactional emails/day on multiple days, or > 2,400/month | **Resend Pro** | $20 / month (50,000 emails) |
| Object storage exceeds 8 GB (`STORAGE_SOFT_LIMIT_GB` alert at 7 GB) | **Cloudflare R2 Pay-As-You-Go** | $0.015 / GB-month above free 10 GB (free egress) |
| Need full managed WAF ruleset or > 5 custom rules | **Cloudflare Pro** | $20 / month (billed annually) |
| Need point-in-time recovery (PITR) or managed DB failover | **Managed PostgreSQL** (e.g., Neon Launch) | Usage-based (~$15–$78 / month) |
| Need hourly FX rate synchronization | **ExchangeRate-API Pro** | $10 / month |
| Heavy interactive map tile traffic | **Paid Map Tile Provider** (`MAP_TILE_URL` env swap) | Varies by volume |

