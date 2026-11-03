# Database Backup & Restore Runbook (Lean Free Mode — ADR-002 / D13)

**Document Version:** 1.0 (Stage 14 Production Launch Readiness)  
**Target Environment:** Docker Compose Production Host (`infra/docker-compose.prod.yml`)  
**Backup Script:** [`scripts/backup-db.sh`](../../scripts/backup-db.sh)  
**Recovery Point Objective (RPO):** Up to 24 hours (nightly encrypted snapshot; no point-in-time recovery in Lean Free Mode).  
**Recovery Time Objective (RTO):** < 15 minutes on a standard 2 GB+ VPS.

---

## 1. Backup Architecture Summary

1. **Schedule:** Nightly cron at `02:30 UTC` on the production host:
   ```cron
   30 2 * * * /opt/wild-hills/scripts/backup-db.sh >> /var/log/wh-backup.log 2>&1
   ```
2. **Format & Encryption:**
   - `pg_dump --format=custom --no-owner --no-privileges` dumps PostgreSQL 16 into a compressed `.dump` archive.
   - [`age`](https://github.com/FiloSottile/age) encrypts the archive using the owner's public key (`BACKUP_AGE_PUBLIC_KEY`).
   - **Security Invariant:** The corresponding `age` private key (`wh-backup-identity.txt`) is **never** stored on the production server or in Git. It remains offline with the company owner (`WILD HILLS REAL ESTATE - L.L.C - S.P.C`).
3. **Storage & Retention:**
   - Uploaded to private Cloudflare R2 bucket `S3_BUCKET_BACKUPS` (`s3://<bucket>/nightly/wh_backup_YYYYMMDD_HHMMSS.dump.age`).
   - Automated retention prunes encrypted archives older than **14 days** (`RETENTION_DAYS=14`).

---

## 2. Step-by-Step Restore Procedure

### Prerequisites
- Access to the production host via SSH.
- AWS CLI configured with R2 credentials (`R2_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- The offline `age` private key (`wh-backup-identity.txt`) copied temporarily to a secure RAM disk (`/dev/shm/age.key`, `chmod 600`) for decryption.

### Step 1: List & Download the Latest Encrypted Backup from R2
```bash
# List available nightly backups
aws s3 ls "s3://${S3_BUCKET_BACKUPS}/nightly/" --endpoint-url "${R2_ENDPOINT_URL}"

# Download the target backup archive
BACKUP_FILE="wh_backup_20261103_023000.dump.age"
aws s3 cp "s3://${S3_BUCKET_BACKUPS}/nightly/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}" \
  --endpoint-url "${R2_ENDPOINT_URL}"
```

### Step 2: Decrypt the Archive with `age`
```bash
# Decrypt using the offline age private key
age --decrypt -i /dev/shm/age.key -o /tmp/wh_restore.dump "/tmp/${BACKUP_FILE}"

# Immediately shred the temporary private key from RAM disk
shred -u /dev/shm/age.key
```

### Step 3: Stop Application Write Traffic (`api` and `worker`)
```bash
cd /opt/wild-hills
docker compose -f infra/docker-compose.prod.yml stop api worker
```

### Step 4: Drop & Recreate Target Database (Clean Restore)
```bash
# Terminate active connections and recreate clean database
docker compose -f infra/docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER}" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
"
docker compose -f infra/docker-compose.prod.yml exec -T postgres dropdb -U "${POSTGRES_USER}" --if-exists "${POSTGRES_DB}"
docker compose -f infra/docker-compose.prod.yml exec -T postgres createdb -U "${POSTGRES_USER}" "${POSTGRES_DB}"

# Ensure required database roles exist before restoring schema objects
docker compose -f infra/docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'wh_public_ro') THEN CREATE ROLE wh_public_ro NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'wh_app_rw') THEN CREATE ROLE wh_app_rw NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'wh_worker') THEN CREATE ROLE wh_worker NOLOGIN; END IF;
  END \$\$;
"
```

### Step 5: Execute `pg_restore`
```bash
cat /tmp/wh_restore.dump | docker compose -f infra/docker-compose.prod.yml exec -T postgres \
  pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --no-privileges --clean --if-exists
```

### Step 6: Verify Restored Data & Security Invariants
```bash
docker compose -f infra/docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "
  SELECT
    (SELECT COUNT(*) FROM listings) AS listings_count,
    (SELECT COUNT(*) FROM public_listings) AS published_listings_count,
    (SELECT COUNT(*) FROM leads) AS leads_count,
    (SELECT COUNT(*) FROM submissions) AS submissions_count,
    (SELECT COUNT(*) FROM users) AS staff_users_count;
"
```

### Step 7: Restart Application Stack & Clean Up
```bash
# Remove unencrypted dump file
rm -f /tmp/wh_restore.dump "/tmp/${BACKUP_FILE}"

# Start API and Worker services
docker compose -f infra/docker-compose.prod.yml start api worker

# Verify API health probe
curl -fsS http://127.0.0.1:4000/v1/internal/healthz
```

---

## 3. Pre-Launch Clean-Instance Restore Verification Record (Section 18.4 Item 3)

- **Automated Verification Suite:** `apps/api/test/stage14-e2e.test.ts` (`Test 3.2: Performs live database backup & clean-instance restore verification test`).
- **Verification Summary:**
  1. Exported live snapshot of `developers`, `locations`, `projects`, `listings`, `listing_images`, `leads`, `submissions`, `exchange_rates`, and `audit_events`.
  2. Spun up an isolated, brand-new PostgreSQL database instance (`PGlite` clean memory instance), executed all production SQL migrations (`0000` through `0003`), recreated `wh_public_ro` / `wh_app_rw` roles and RLS policies, and restored the snapshot.
  3. Verified 100% row-count parity across all core tables, confirmed `public_listings` view integrity, and verified that `wh_public_ro` read-only permissions remain strictly enforced after restore.

