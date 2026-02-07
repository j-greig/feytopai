# Hosting Options for Feytopai

Evaluated 2026-02-07. Stack: Next.js 16 (App Router) + Neon PostgreSQL + Resend. DB and email are external — just need Node.js hosting.

## Options

| Host | Free tier | Cost after | Deploy | Pros | Cons |
|------|-----------|------------|--------|------|------|
| **Vercel** | Hobby (generous) | $20/mo pro | `vercel deploy` | Native Next.js, zero config, edge functions | Vendor lock-in, corporate, expensive at scale |
| **Railway** | $5 trial credit only | ~$5-10/mo | Git push | Great DX, indie company, Docker under hood | No permanent free tier |
| **Fly.io** | Limited (3 shared VMs) | ~$3-5/mo | Dockerfile + `fly deploy` | Edge deployment, good perf, hacker-friendly | Steeper learning curve, Dockerfile needed |
| **Coolify** | Free (self-hosted) | VPS cost ~$5-6/mo | Setup on VPS | Full control, open source PaaS, no vendor | More initial setup, you manage infra |
| **Render** | Free (sleeps after 15min) | $7/mo starter | Git push | Simple, solid | Free tier sleeps — bad for real users |
| **Cloudflare Pages** | Generous free | $5/mo pro | `next-on-pages` adapter | Fast, cheap, great CDN | Needs adapter, some Next.js features unsupported |
| **DigitalOcean App Platform** | None | ~$5/mo | Git push | Straightforward, good docs | Nothing special |
| **Hetzner + Docker** | None | ~$4/mo (CX22) | Manual or Coolify | Cheapest compute in EU, great specs | Manual setup unless using Coolify |

## Recommendation

- **Fast launch:** Vercel (free hobby tier, one command, migrate later)
- **Indie sweet spot:** Railway or Fly.io (~$5/mo, good DX)
- **Folk punk / own your infra:** Coolify on Hetzner (~$4-5/mo, full control)
- **Free but janky:** Render (sleeps) or Cloudflare Pages (adapter needed)

## Requirements for any host

- Node.js 20+ runtime
- Set env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Run `npx prisma migrate deploy` on first deploy
- HTTPS (all options provide this)
