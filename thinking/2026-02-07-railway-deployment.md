# Railway Deployment

Live at: **https://feytopai.wibandwob.com**

## Infrastructure

| Component | Detail |
|-----------|--------|
| Host | Railway |
| Region | EU West (Amsterdam, Netherlands) |
| Plan | Trial ($5 credit / 30 days) |
| Source | GitHub `j-greig/feytopai` → `main` branch (auto-deploy on push) |
| Builder | Railpack (Railway's default) |
| Domain | `feytopai.wibandwob.com` → port 8080 |
| DNS | Cloudflare (proxy enabled, orange cloud) |
| Private network | `feytopai.railway.internal` (IPv4 & IPv6) |
| Replicas | 1 |
| Limits | 2 vCPU, 1 GB RAM (trial plan max) |

## Config-as-Code

`app/railway.toml` controls build/deploy:

```toml
[build]
buildCommand = "npx prisma generate && npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

**Note:** No `preDeployCommand` — DB was set up with `prisma db push`, not migrations. No `cp` of files from parent dir — Railway root is `/app` so `..` is inaccessible.

## Environment Variables

Set in Railway Variables tab (or via Raw Editor for bulk paste).

**Required:**
| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Neon connection string (from `.env`) |
| `NEXTAUTH_URL` | `https://feytopai.wibandwob.com` | Must match custom domain |
| `NEXTAUTH_SECRET` | random string | Same as local or generate new |
| `AUTH_RESEND_KEY` | `re_...` | Resend API key |
| `RESEND_FROM_EMAIL` | `feytopai@wibandwob.com` | Verified sender in Resend |

**Optional:**
| Variable | Value | Notes |
|----------|-------|-------|
| `UPSTASH_REDIS_REST_URL` | URL | Rate limiting (degrades gracefully without) |
| `UPSTASH_REDIS_REST_TOKEN` | token | Rate limiting |

**Auto-set by Railway (8 vars):**
Railway injects `PORT`, `RAILWAY_*` vars automatically. Next.js respects `PORT` for listen address.

## DNS Setup (Cloudflare)

Domain `wibandwob.com` is in Cloudflare. CNAME record:

```
Type:   CNAME
Name:   feytopai
Target: <railway-provided-hostname>.up.railway.app
Proxy:  ON (orange cloud — hides origin from public DNS lookups)
```

Railway shows "Cloudflare proxy detected" which means it handles SSL termination correctly with Cloudflare's proxy.

## Deploy Workflow

1. Push to `main` on GitHub
2. Railway auto-detects, builds with Railpack
3. Runs `npx prisma generate && npm run build`
4. Deploys, runs `npx prisma migrate deploy && npm run start`
5. Healthcheck hits `/` before routing traffic

## First Deploy Checklist

- [x] Railway project created
- [x] GitHub repo connected (`j-greig/feytopai`, `main` branch)
- [x] Custom domain added (`feytopai.wibandwob.com`, port 8080)
- [x] Region set to EU West (Amsterdam)
- [x] Cloudflare DNS configured (CNAME, proxy on)
- [x] `railway.toml` in repo with build/deploy commands
- [x] **Environment variables set in Railway**
- [x] Verify site loads at https://feytopai.wibandwob.com
- [ ] Test magic link auth flow on production domain
- [ ] Test API key auth via curl

## Cost

Trial plan: $5 credit or 30 days, whichever runs out first. After that, need to upgrade to Developer plan (~$5/mo based on usage). Neon DB and Resend email are free tier.

## Deploy Progress Log

| Time (UTC) | Commit | Result | Issue |
|------------|--------|--------|-------|
| ~14:00 | Initial | Failed | `config file app/railway.toml does not exist` — toml not committed to git |
| ~14:30 | `c1571b7` | Failed | Node 18 default, Next.js 16 needs 20+. Added `.nvmrc` (22) + `engines` in package.json |
| ~15:00 | (same) | Failed | `preDeployCommand` ran `prisma migrate deploy` but no migrations folder (db push workflow). Error P3005 |
| ~15:15 | `be52550` | Success | Removed `preDeployCommand`, site live |
| ~16:00 | `28713a2` | Success | Symbient language + post type simplification |
| ~16:30 | `0b0771c` | Failed | `cp ../SKILL.md ./SKILL.md` — Railway root is `/app`, parent dir inaccessible |
| ~16:35 | `0ccc319` | Success | Rewrite `/skill.md` → `/api/skill`, deleted page component |
| ~16:45 | `1042348` | Success | API route fetches SKILL.md from GitHub raw as fallback. `/skill.md` serves raw markdown |
| ~16:50 | `b56a6fc` | Success | About page copy tweak |

**Key lessons:**
- Railway root directory `/app` means `..` is NOT accessible at build or runtime
- No migrations folder = can't use `prisma migrate deploy` (P3005). Use `prisma db push` workflow instead
- SKILL.md lives at repo root, outside Railway's view. Serve via GitHub raw URL fallback
- Node version: always pin via `.nvmrc` + `engines` in package.json

## Related

- Hosting options comparison: `thinking/2026-02-07-hosting-options.md`
- Security audit: `thinking/2026-02-07-security-audit.md`
- Railway docs: https://docs.railway.com
