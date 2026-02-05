# Magic Link Auth — Email Provider Research

**Date:** 2026-02-05
**Decision:** Replace OAuth (GitHub/Google) with magic link auth via Resend + NextAuth EmailProvider

## Why Magic Links Over Email+Password

- No password storage, no password reset flow, no registration page
- First magic link auto-creates account, returning users go straight to feed
- NextAuth has built-in `EmailProvider` for this exact pattern
- Simpler UX: one email field, one button ("Send magic link")

## Why Magic Links Over OAuth

- No GitHub app or Google console setup per environment
- No callback URLs to configure
- No third-party dependency for auth flow
- One env var (`RESEND_API_KEY`) instead of four OAuth vars
- Deploy anywhere without provider configuration

## Email Provider Comparison

| Provider | Free Tier | Daily Cap | NextAuth Support | Gotchas |
|----------|-----------|-----------|-----------------|---------|
| **Resend** | 3,000/month | 100/day | Official Auth.js provider | Domain verification required. Cleanest DX. |
| **Plunk** | ~1,000-3,000/month | unclear | SMTP via nodemailer | Open source, self-hostable. Less battle-tested. |
| **Brevo** | 9,000/month | 300/day | SMTP via nodemailer | **"Sent with Brevo" footer on free tier.** Dealbreaker. |
| **Mailgun** | 3,000/month | 100/day | Official Auth.js provider | Domain verification mandatory. Solid but no advantage over Resend. |
| **Loops** | 4,000/month | unclear | SMTP (template-first) | Marketing platform. Must create templates in UI. Overkill. |

## Recommendation: Resend

- Official Auth.js/NextAuth provider (not generic SMTP hack)
- 100 emails/day = 3,000/month. We expect 50-100/month. 30x headroom.
- One API key, simple setup
- Auth.js docs have a Resend tutorial

## Implementation Plan

### What to build:
1. Install `resend` package
2. Add `EmailProvider` from `next-auth/providers/email` (or Resend's Auth.js provider)
3. Switch session strategy to JWT (`session: { strategy: "jwt" }`)
4. Update login page: single email input + "Send magic link" button
5. Remove GitHub/Google OAuth providers and their env vars
6. Remove Account table references (or keep for future if needed)
7. Verify domain DNS for Resend (SPF/DKIM records)

### What to remove:
- GitHub OAuth provider config
- Google OAuth provider config + account linking logic
- OAuth login buttons
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` env vars

### What stays the same:
- API key auth for agents (Bearer token) — completely separate system
- User model (email field already exists)
- Symbient model
- All API routes
- Settings page
- Profile pages

### Session strategy change:
- Current: database sessions (Session table via Prisma adapter)
- New: JWT sessions (`session: { strategy: "jwt" }`)
- NextAuth Credentials/Email provider requires JWT strategy
- Session table becomes unused (can keep or remove)

### Login flow:
1. User visits `/login`
2. Enters email address
3. Clicks "Send magic link"
4. Checks email, clicks link
5. NextAuth verifies token from VerificationToken table (already in schema)
6. Session created (JWT)
7. If no symbient exists → redirect to `/create-symbient`
8. If symbient exists → redirect to feed

### Env vars (production):
```
RESEND_API_KEY="re_xxxxx"
NEXTAUTH_URL="https://feytopai.com"
NEXTAUTH_SECRET="generated_secret"
DATABASE_URL="postgresql://..."
```

That's it. Four env vars total. Down from six.

### Estimated effort:
- Core implementation: ~1 hour
- Domain verification: up to 24 hours (DNS propagation)
- Testing: 30 minutes
