# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-05 (end of session)

---

## Next Session: Magic Link Auth (Resend)

Replace OAuth (GitHub/Google) with magic link auth via Resend + NextAuth EmailProvider.

**Why:** No passwords, no OAuth provider setup, no callback URLs. One email field, one button. Deploy anywhere with one env var (`RESEND_API_KEY`).

**What's needed:**
- Add Resend's Auth.js provider (official integration)
- Switch NextAuth session strategy from database to JWT
- Update login page: email input + "Send magic link" button
- Remove GitHub/Google OAuth providers and env vars
- Verify domain DNS for Resend (SPF/DKIM)
- Pre-launch, no users to migrate

**Estimated effort:** ~1 hour for core implementation. DNS verification up to 24h.

**Full plan:** `thinking/2026-02-05-magic-link-auth.md`

---

## Completed This Session

- [x] Google OAuth + multi-provider account linking
- [x] API key authentication (Bearer tokens for agents)
- [x] Settings page (human + symbient profile editing, API key generation)
- [x] ID-based profile pages (/profile/{symbientId})
- [x] Comment editing (15-min window) and deletion
- [x] Post deletion with cascade
- [x] About page (trimmed)
- [x] /skill.md route serving SKILL.md
- [x] Security audit: API key hash leak fix, URL protocol validation
- [x] Display name priority (name || username || githubLogin) everywhere
- [x] Sort tabs UI (underline style)
- [x] SKILL.md rewritten as agent-facing skill with automation setup guide
- [x] All pushed to GitHub (6 commits this session, 13 total ahead of last deploy)

---

## Before Production Deploy

- [ ] **Auth refactor: magic links via Resend** (see above)
- [ ] Set up production environment variables
- [ ] Run database migration on production DB
- [ ] Test auth flow on production domain
- [ ] Verify API routes work in production
- [ ] Choose deployment target (Vercel / Railway / Fly.io)
- [ ] Choose domain (feytopai.com?)

---

## Post-Launch Polish

- [ ] Email templates (custom magic link email styling)
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
**Auth:** NextAuth.js with GitHub + Google OAuth + API key auth
**Stack:** Next.js 16.1.6, Prisma 7, Tailwind CSS, bcrypt

**Latest commits (this session):**
- `33b51f8` - Add testing infrastructure and development planning docs
- `3143272` - Rewrite SKILL.md as agent-facing skill with automation setup guide
- `1f78fd1` - UI: ID-based profile links, display names, sort tabs, edit/delete UI
- `6dc20ab` - Security: prevent API key hash leaks, add URL validation, update auth
- `78e66b8` - Add settings page, user profiles, comment CRUD, about page, skill.md route
- `7ce60e4` - Add Google OAuth, API key auth, and multi-provider account linking
