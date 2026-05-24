# Deploy — Nuxt Storefront

CI/CD mirrors the pattern used by `go-e-learning` and `vue-e-learning`:
push to `staging` or `main` → GitHub Actions builds + pushes Docker
image → SSHes to VPS → `docker compose pull && up -d`.

---

## Hostname plan (post-migration)

| Host | Service | Container |
|---|---|---|
| `staging.drillspace.id` | **Storefront (B2C)** | `nuxt-e-learning-staging` |
| `staging.lms.drillspace.id` | Admin / LMS | `vue-e-learning-staging` |
| `api.staging.drillspace.id` | Backend API | `go-e-learning-staging` |

Production (when ready):

| Host | Service |
|---|---|
| `drillspace.id` | Storefront |
| `lms.drillspace.id` | Admin / LMS |
| `api.drillspace.id` | Backend API |

---

## 1. GitHub repository secrets

Set these under **Settings → Secrets and variables → Actions** for
`aldhirs/nuxt-e-learning`. Same values as the other two repos — copy
from `aldhirs/vue-e-learning` or `aldhirs/go-e-learning`.

| Secret | Value source | What it does |
|---|---|---|
| `DOCKER_USERNAME` | Docker Hub account `tecnoduct` | login for image push |
| `DOCKER_PASSWORD` | Docker Hub access token (NOT password) | login for image push |
| `VPS_HOST` | `194.233.69.119` | SSH target |
| `VPS_USER` | `root` | SSH user |
| `VPS_SSH_KEY` | private key matching VPS authorized_keys | SSH auth |
| `TELEGRAM_CHAT_ID` | deploy-notification channel ID | success/failure ping |
| `TELEGRAM_BOT_TOKEN` | bot token (`123456:ABC…`) | success/failure ping |

> The Docker Hub repo `tecnoduct/nuxt-e-learning` is already created
> (per user) — no action needed there.

## 2. GitHub environments

Create two environments under **Settings → Environments**:

- `staging` — no required reviewers
- `production` — optional manual approval reviewer

The workflow's `environment: ${{ ... }}` line picks the right one based
on the branch / dispatch input.

---

## 3. VPS setup — one-time migration

This is the careful part: the storefront takes over the host the
admin SPA currently uses. Vue admin moves to a new subdomain at the
same time. Plan to do this in a 5-minute maintenance window.

### 3a. DNS records

Add / verify at the DNS provider (Cloudflare / Namecheap / whichever
manages `drillspace.id`):

| Record | Type | Value | TTL |
|---|---|---|---|
| `staging.drillspace.id` | A | `194.233.69.119` | existing (already points here) |
| `staging.lms.drillspace.id` | A | `194.233.69.119` | **NEW** — propagate before step 3b |

Wait for `dig +short staging.lms.drillspace.id` to return the IP
before continuing — otherwise Traefik's Let's Encrypt challenge will
fail on the first request to the LMS host.

### 3b. Edit `/root/e-learning/staging/docker-compose.yml` on the VPS

```bash
ssh root@194.233.69.119
cd /root/e-learning/staging
cp docker-compose.yml docker-compose.yml.bak.$(date +%Y%m%d-%H%M%S)
```

**Two edits in the same file**:

**Edit 1** — change the Vue admin Traefik label from
`staging.drillspace.id` to `staging.lms.drillspace.id`:

```yaml
# BEFORE
- "traefik.http.routers.elearning-frontend.rule=Host(`staging.drillspace.id`)"
# AFTER
- "traefik.http.routers.elearning-frontend.rule=Host(`staging.lms.drillspace.id`)"
```

**Edit 2** — append the nuxt service block from
`deploy/staging-compose-snippet.yml` under `services:`.

Validate:

```bash
docker compose config --quiet      # expect no output = OK
```

### 3c. Update backend CORS — `/root/e-learning/staging/.env`

The Go backend whitelists origins for CORS. Add the new LMS host AND
make sure the storefront host stays there (Nuxt will fetch the API
client-side too):

```bash
# BEFORE
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://staging.drillspace.id,http://localhost:5173,http://localhost:5174

# AFTER (add staging.lms.drillspace.id, keep the others)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://staging.drillspace.id,https://staging.lms.drillspace.id,http://localhost:5173,http://localhost:5174
```

Then restart the API container so the new env loads:

```bash
docker compose up -d --force-recreate go-e-learning-staging
```

### 3d. Push the first storefront build

Locally:

```bash
cd nuxt-e-learning
git push origin staging      # triggers CI
```

CI builds + pushes `tecnoduct/nuxt-e-learning:staging`, SSH-deploys,
runs health check. ~4-5 min end-to-end.

### 3e. Apply Vue label change + start Nuxt

After the Docker Hub push completes (Telegram notification fires):

```bash
ssh root@194.233.69.119
cd /root/e-learning/staging
# Recreate Vue with the new Traefik label
docker compose up -d --force-recreate vue-e-learning-staging
# Start the new Nuxt container
docker compose up -d nuxt-e-learning-staging
# Verify
curl -sv https://staging.drillspace.id/         # → Nuxt storefront (200)
curl -sv https://staging.lms.drillspace.id/     # → Vue admin (200)
curl -sv https://api.staging.drillspace.id/health/ready  # → 200
```

Traefik picks up the new label automatically and starts the cert
issuance for `staging.lms.drillspace.id` on first request — takes
~30 seconds; the first hit may see a `CERT_AUTHORITY_INVALID` until
it completes.

### 3f. Production analog

Same flow against `/root/e-learning/production/docker-compose.yml`
and the production CORS env. Production hosts use the bare apex:
`drillspace.id` (storefront) + `lms.drillspace.id` (admin) +
`api.drillspace.id` (backend).

---

## How it works (CI/CD flow)

| Trigger | Result |
|---|---|
| Push to `staging` | Builds `tecnoduct/nuxt-e-learning:staging` + `:staging-<sha>`, SSH-deploys to staging slot. |
| Push to `main` | Builds `tecnoduct/nuxt-e-learning:production` + `:production-<sha>`, SSH-deploys to production slot. |
| Manual `workflow_dispatch` | Same as above; can pick environment explicitly. |
| PR open / push to either branch | `verify.yml` runs lint + Nuxt build smoke (no deploy). |

The Dockerfile is 2-stage. Stage 1 is `node:20-alpine` for building
(needs all deps + source). Stage 2 is the same base but only the
`.output/` bundle survives — no node_modules, no source — so the
runtime image stays slim (~209 MB).

Nuxt build-args worth knowing about:

| Build arg | Default | Effect |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `https://api.staging.drillspace.id/api/v1` | Frozen into the client bundle — used by every fetch from the storefront. |
| `NUXT_PUBLIC_ANALYTICS_ENABLED` | `false` (`true` on production) | Toggles the analytics module shim. |
| `NUXT_PUBLIC_ENABLE_PROFILE_EDIT` | `true` | Feature-flag for the profile-edit page. Kill-switch to `false` if BE breaks. |
| `BUILD_VERSION` | git SHA | Shown in footer + sent in `X-App-Version` header (future). |
| `BUILD_TIME` | commit timestamp | Same. |

---

## Local smoke test

```bash
docker build -t nuxt-storefront:smoke \
  --build-arg NUXT_PUBLIC_API_BASE_URL=https://api.staging.drillspace.id/api/v1 \
  .

docker run -d --name nuxt-smoke -p 3777:3000 nuxt-storefront:smoke
curl -sv http://localhost:3777/        # expect 200
docker rm -f nuxt-smoke
```

Container listens on **port 3000**. Traefik forwards
`staging.drillspace.id` → container:3000.

---

## Rolling back

```bash
ssh root@194.233.69.119
cd /root/e-learning/staging
# Pin to the previous immutable SHA tag
docker pull tecnoduct/nuxt-e-learning:staging-<previous-sha>
docker tag tecnoduct/nuxt-e-learning:staging-<previous-sha> tecnoduct/nuxt-e-learning:staging
docker compose up -d nuxt-e-learning-staging
```

Each deploy publishes both `:<env>` (mutable) and `:<env>-<sha>`
(immutable). The SHA tag is the rollback anchor.
