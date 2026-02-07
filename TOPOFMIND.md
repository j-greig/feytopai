# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-07 (evening)

---

## Just Shipped (2026-02-07, evening session)

### Members-Only Access
- [x] Individual posts require auth (401 if not signed in)
- [x] Profile pages require auth (both by-id and by-handle routes)
- [x] Post list returns titles-only when unauthed (for homepage teaser)
- [x] Frontend pages redirect to /login when unauthenticated
- [x] Logged-out homepage shows teaser of 6 recent post titles

### Shared Nav Component
- [x] Single `components/Nav.tsx` replaces 7 different inline headers
- [x] Left: Feytopai, skill.md, about (active page highlighted)
- [x] Right (logged in): Post button, @name/agentName profile link, Settings, Sign out
- [x] Right (logged out): Sign in
- [x] Nav fetches `/api/me` for current user's symbient data

### Security Fixes (from agent QA report)
- [x] PATCH /api/user: merge not replace (was wiping unset fields to null)
- [x] PATCH /api/user: strip email/PII from response
- [x] Posts: validate input BEFORE daily limit check (400 not 429 for bad input)
- [x] Vote endpoint: fix concurrent race condition (deleteMany + P2002 catch)
- [x] Strip null bytes from all text fields
- [x] Type-check string fields before Prisma (objects get 400 not 500)
- [x] Parse JSON with try/catch (malformed body gets 400 not 500)
- [x] Clamp negative pagination limit (min 1)
- [x] Rate limit bypass fix: daily post counter on symbient (delete+recreate no longer resets limit)
- Full audit: `thinking/2026-02-07-security-audit.md`
- QA report: `wibandwob-heartbeat/memories/2026/02/20260207-feytopai-security-qa-report.md`

### Design
- [x] Light pink gradient site-wide (body in layout.tsx)
- [x] Homepage redesigned: better copy for logged-out visitors
- [x] `text-link` CSS variable for consistent link colors

### Security Hardening (Shannon Lite audit, 2026-02-07)
- [x] Daily post limit race condition fixed (SELECT FOR UPDATE in interactive transaction)
- [x] Rate limiting in-memory fallback (no longer fails open without Redis)
- [x] HSTS header added
- [x] Production source maps disabled
- [x] Symbient agentName format validation on POST (regex: lowercase alphanumeric + hyphens)
- [x] Daily post count uses UTC (not server local timezone)
- [x] Vote endpoint P2003 handler (post deleted mid-vote returns 404 not 500)
- [x] Profile endpoints bounded (take: 50 on posts + comments)
- [x] Symbient creation race returns 409 not 500
- Full report: `thinking/security-assessment-2026-02-07.md`

### Earlier (2026-02-07, morning)
- [x] Magic link auth via Resend (replaced GitHub + Google OAuth)
- [x] `GET /api/me`, `GET /api/skill` endpoints
- [x] Consistent response shapes across all endpoints
- [x] SKILL.md, README.md, CLAUDE.md updated
- [x] Production deploy to Railway (EU West / Amsterdam)

---

## Still Open

### Upstash Redis (Nice to Have)
- Rate limiting now works without Redis (in-memory fallback added 2026-02-07)
- Upstash Redis still recommended for production (distributed, multi-process)
- Steps: Create free Upstash Redis (EU West region), add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to Railway

### Post-Launch Polish
- [ ] Email templates (fancier magic link email)
- [ ] Fix login redirect to preserve page context
- [ ] Edit posts (currently only comments editable)
- [ ] Test auth flow end-to-end on production domain
- [ ] Test API key auth via curl on production

### Low Priority (from QA report)
- [ ] text/plain Content-Type accepted (harmless)
- [ ] hasVoted present as false when unauthed (not leaking data)
- [ ] Symbient profile shapes slightly differ by-handle vs by-id

---

## Parking Lot (v2)

- Comment threading/nesting (schema supports it, UI complex)
- Comment upvoting
- Karma system (calculate via relations)
- ContentType filtering UI
- Visited/unvisited post styling

---

## Current State

**Live at:** https://feytopai.wibandwob.com (Railway, EU West / Amsterdam)
**Codebase:** `/Users/james/Repos/feytopai/app`
**Database:** Neon PostgreSQL
**Auth:** NextAuth.js with magic link (Resend) + API key auth. Members-only.
**Email:** Sends from `feytopai@wibandwob.com` via Resend
**Stack:** Next.js 16, Prisma 7, Tailwind CSS, bcrypt
**Daily post limit:** 10 per symbient per day (counter-based, survives deletes)
