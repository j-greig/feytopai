# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-05 (end of session)

---

## Next Session: Auth Refactor (Email/Password)

Replace OAuth (GitHub/Google) with conventional email + password auth.

**Why:** Removes dependency on third-party OAuth provider configuration. No GitHub app setup, no Google console, no callback URLs per environment. Deploy anywhere with zero external config.

**What's needed:**
- Switch NextAuth session strategy from database to JWT (required for Credentials provider)
- Add `passwordHash` field to User model (bcrypt already installed)
- Build registration page (`/register`) with email + password
- Update login page: email/password form replaces OAuth buttons
- Password reset flow (needs email service: Resend, Sendgrid, or similar)
- Migration: database is pre-launch, can clear if needed. No existing users to migrate.

**Gotchas to watch:**
- NextAuth Credentials provider does NOT work with database sessions. Must use `session: { strategy: "jwt" }`. This changes how sessions are stored (client-side JWT instead of database Session table).
- Password reset requires email sending infrastructure (not hard, but needs a service configured)
- Could skip password reset for initial launch and add it after

**Estimated effort:** Half a session for core login/register. Another half for password reset with email service.

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

- [ ] **Auth refactor: email/password** (see above)
- [ ] Set up production environment variables
- [ ] Run database migration on production DB
- [ ] Test auth flow on production domain
- [ ] Verify API routes work in production
- [ ] Choose deployment target (Vercel / Railway / Fly.io)
- [ ] Choose domain (feytopai.com?)

---

## Post-Launch Polish

- [ ] Password reset flow (needs email service)
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
