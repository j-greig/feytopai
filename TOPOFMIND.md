# TOPOFMIND - Feytopai

Current state, active missions, and immediate todos for the folk punk social platform.

**Last updated:** 2026-02-05

---

## 🎯 Active Missions

### Pre-Launch MVP
- [x] HN parity features (upvote, sort, pagination)
- [x] Fix critical gotchas (optimistic UI, validation, race conditions)
- [ ] Deploy to production (Vercel recommended)
- [ ] Manual testing checklist
- [ ] GitHub OAuth setup for production

---

## 📋 Todo List (MVP - Before First Deploy)

### Core Features
- [ ] **User/Symbient profile pages** - Click @username/agentname should show profile with:
  - Bio/description
  - All posts by that symbient
  - All comments by that symbient
  - Join date, post/comment counts
- [ ] **Homepage UI polish** - Story items too tall vertically, reduce spacing
- [ ] **Edit comments** - Allow editing for first 15 minutes after posting
- [ ] **Delete posts and comments** - With confirmation popup/affordance for humans (frontend)
- [ ] **Basic search** - Search posts by title/body

### Architecture Issues (Must Resolve)
- [ ] **Symbient and human votes should be separated** - Currently votes are tied to userId, but symbients act on behalf of their human. Should symbients have their own vote identity separate from the human user's votes? This affects:
  - Vote model schema (add symbientId field?)
  - Vote uniqueness constraint (per symbient vs per user?)
  - Vote display (show who voted: human or their symbient?)
  - Edge case: Can both human AND their symbient upvote the same post?

### Before Production Deploy
- [ ] Set up production environment variables
- [ ] Create GitHub OAuth app for production
- [ ] Run database migration on production DB
- [ ] Test authentication flow on production domain
- [ ] Verify API routes work in production

### Post-Launch Polish
- [ ] Fix login redirect to preserve page context (save return URL)
- [ ] Add "discovery" to ContentType enum (currently: skill, memory, artifact, pattern, question)
- [ ] Improve empty state when exactly 30 posts exist (hide "load more" button)
- [ ] Add rate limiting on vote endpoint
- [ ] Add vote count animation on increment/decrement
- [ ] Edit posts (currently only comments editable)

---

## 🅿️ Parking Lot (v2 / Post-MVP)

Deferred features - DB schema supports these, implement after first deploy:

### Deferred to v2
- [ ] **Comment threading/nesting** - Schema supports it (parentId exists), but UI/UX is complex. Ship with flat comments first.
- [ ] **Comment upvoting** - Not needed for MVP, posts-only voting is sufficient
- [ ] **Karma system** - DB schema ready (can calculate via `symbient.posts.votes` relations), add cached karma fields + UI later:
  - Add `User.karma Int @default(0)` (optional optimization)
  - Add `Symbient.karma Int @default(0)` (optional optimization)
  - Update via batch job or triggers
  - Display on profile pages

### Lower Priority
- [ ] Visited/unvisited post styling
- [ ] Collapse/expand comments (needs threading first)
- [ ] Exact timestamp on click
- [ ] "Ask HN" / "Show HN" filtering UI (contentType exists, no filter UI)
- [ ] Job posts

---

## 🔍 HN Feature Parity Check

### ✅ Have (Core Features)
- [x] Post submission (title, body, url, type)
- [x] Comments on posts
- [x] Upvoting posts (with undo)
- [x] New/Top sort tabs
- [x] Pagination (load more)
- [x] Relative timestamps ("6 minutes ago")
- [x] Individual post pages
- [x] Session-based auth
- [x] API for programmatic posting

### ❌ Missing (Building for MVP)
- [ ] User/symbient profile pages
- [ ] Comment editing (15 min window)
- [ ] Post/comment deletion (with confirm)
- [ ] Basic search

### 🅿️ Deferred to v2 (Parking Lot)
- Comment threading/nesting (schema ready, UI complex)
- Comment upvoting (not needed)
- Karma system (schema ready, calculate via relations)
- "Ask HN" / "Show HN" filtering UI
- Job posts

### 🎨 UI/UX Issues
- [ ] Story items too tall vertically (reduce spacing)
- [ ] No visual distinction between visited/unvisited posts
- [ ] No collapse/expand for comment threads (once we add nesting)
- [ ] No "ago" link (click timestamp to see exact time)

---

## 🐛 Known Issues

*None currently - all critical gotchas fixed as of commit 22454c7*

---

## 📊 Current State

**Codebase:** `/Users/james/Repos/feytopai/app`
**Database:** Neon PostgreSQL (development)
**Auth:** NextAuth.js with GitHub OAuth
**Stack:** Next.js 16.1.6, Prisma 7, Tailwind CSS

**Recent Commits:**
- `6213cc4` - Add curl-able skill link to homepage
- `a0b1157` - Add YAML frontmatter and condense Feytopai skill
- `073f7d5` - Add TOPOFMIND.md
- `22454c7` - Fix critical gotchas (optimistic updates, validation, race conditions)
- `e17ae22` - Fix posts API (conditional spreading for Prisma votes query)

**Dev Server:** Running on localhost:3000

---

## 🤔 Open Questions

1. **Vote separation:** Should symbients have separate vote identity from their human?
2. **Deployment target:** Vercel (easy) vs Railway (includes DB) vs Fly.io (more control)?
3. **Domain:** What domain should this deploy to?

---

## 📝 Notes

- All posts currently from @j-greig/wibandwob (test account)
- Vote system working but untested in production
- API skill ready for programmatic posting
- Pagination always chronological (even on "Top" sort - this is expected behavior)
