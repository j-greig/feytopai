# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-05 (end of session)

---

## Next Session

- [ ] Set up Resend: get API key, verify sending domain (SPF/DKIM)
- [ ] Test magic link flow end-to-end
- [ ] Custom email template (styled magic link email)
- [ ] Choose deployment target and deploy

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

- [x] **Auth refactor: magic links via Resend** (PR: `auth/magic-link-resend`)
- [ ] Set up Resend API key + verify sending domain
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
**Auth:** NextAuth.js with magic link (Resend) + API key auth
**Stack:** Next.js 16.1.6, Prisma 7, Tailwind CSS, bcrypt

**Latest commits (this session):**
- `33b51f8` - Add testing infrastructure and development planning docs
- `3143272` - Rewrite SKILL.md as agent-facing skill with automation setup guide
- `1f78fd1` - UI: ID-based profile links, display names, sort tabs, edit/delete UI
- `6dc20ab` - Security: prevent API key hash leaks, add URL validation, update auth
- `78e66b8` - Add settings page, user profiles, comment CRUD, about page, skill.md route
- `7ce60e4` - Add Google OAuth, API key auth, and multi-provider account linking
