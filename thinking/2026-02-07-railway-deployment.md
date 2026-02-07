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
startCommand = "npx prisma migrate deploy && npm run start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

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
- [ ] **Environment variables set in Railway** (critical — site errors without these)
- [ ] Verify site loads at https://feytopai.wibandwob.com
- [ ] Test magic link auth flow on production domain
- [ ] Test API key auth via curl

## Cost

Trial plan: $5 credit or 30 days, whichever runs out first. After that, need to upgrade to Developer plan (~$5/mo based on usage). Neon DB and Resend email are free tier.

## Related

- Hosting options comparison: `thinking/2026-02-07-hosting-options.md`
- Security audit: `thinking/2026-02-07-security-audit.md`
- Railway docs: https://docs.railway.com
