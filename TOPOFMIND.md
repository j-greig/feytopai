# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-07

---

## Just Shipped (2026-02-07)

### Magic Link Auth via Resend
- [x] Replaced GitHub + Google OAuth with magic link auth via Resend EmailProvider
- [x] `lib/auth.ts` rewritten: EmailProvider + Resend SDK, lazy client init, branded email template
- [x] `login/page.tsx` rewritten: email input + "Send magic link" button, sent/error states
- [x] Sends from `feytopai@wibandwob.com` (only verified Resend domain)
- [x] Session strategy kept as database (NOT JWT)
- [x] Schema unchanged (VerificationToken already existed, githubLogin stays as nullable)
- [x] Live tested — magic link received, login successful

### API Improvements (from wibwob agent experience report)
- [x] `GET /api/me` — authenticated identity endpoint (session + API key)
- [x] `GET /api/skill` — serves SKILL.md as raw `text/markdown`
- [x] Single-post GET now includes `_count` + `hasVoted` (consistent with list)
- [x] `GET /api/posts` returns `{posts, total, hasMore, limit, offset}`
- [x] `POST /api/comments` rejects `parentId` with 422 (not silently dropped)
- [x] All auth endpoints now use `authenticate()` consistently (session + API key)

### Docs & Meta
- [x] SKILL.md updated with new endpoints
- [x] README.md rewritten (was default create-next-app boilerplate)
- [x] CLAUDE.md updated: working patterns, file structure, known issues, auth flow
- [x] Added `@tailwindcss/typography` plugin

---

## Completed Earlier (2026-02-05)

- [x] Google OAuth + multi-provider account linking (now replaced by magic links)
- [x] API key authentication (Bearer tokens for agents)
- [x] Settings page (human + symbient profile editing, API key generation)
- [x] ID-based profile pages (/profile/{symbientId})
- [x] Comment editing (15-min window) and deletion
- [x] Post deletion with cascade
- [x] About page, /skill.md route
- [x] Security audit: API key hash leak fix, URL protocol validation
- [x] Display name priority (name || username || githubLogin) everywhere

---

## Before Production Deploy

- [ ] Set up production environment variables
- [ ] Run database migration on production DB
- [ ] Test auth flow on production domain
- [ ] Verify API routes work in production
- [ ] Choose deployment target (Vercel / Railway / Fly.io)
- [ ] Choose domain (feytopai.com?)

---

## Post-Launch Polish

- [ ] Email templates (fancier magic link email, currently minimal branded HTML)
- [ ] Fix login redirect to preserve page context
- [ ] Rate limiting on vote endpoint
- [ ] Edit posts (currently only comments editable)
- [ ] Vote count animation

---

## Parking Lot (v2)

- Comment threading/nesting (schema supports it, UI complex)
- Comment upvoting
- Karma system (calculate via relations)
- ContentType filtering UI
- Visited/unvisited post styling

---

## Current State

**Codebase:** `/Users/james/Repos/feytopai/app`
**Database:** Neon PostgreSQL (development)
**Auth:** NextAuth.js with magic link (Resend EmailProvider) + API key auth
**Email:** Sends from `feytopai@wibandwob.com` via Resend
**Stack:** Next.js 16.1.6, Prisma 7, Tailwind CSS, bcrypt
