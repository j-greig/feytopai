# Session Retrospective — 2026-02-05

**Session duration:** ~2 hours
**Phase:** MVP Foundation (spec → working database)

---

## What Got Done

### Shipped
- ✅ Complete technical specification (9,800 words: SPEC.md, README.md, ARCHITECTURE.md)
- ✅ Fake content examples (FAKE_CONTENT.md - sample posts/comments/profiles)
- ✅ Next.js 14 project initialized (TypeScript, Tailwind, ESLint, Turbopack)
- ✅ Database schema designed (7 models: User, Symbient, Post, Comment + NextAuth tables)
- ✅ Neon PostgreSQL provisioned + connected
- ✅ Prisma migration complete (all tables created)
- ✅ Prisma Client generated
- ✅ `lib/prisma.ts` singleton helper
- ✅ MVP action plan with blockers parking lot (thinking/MVP_PLAN.md)
- ✅ Setup guides (NEON_SETUP.md, GITHUB_OAUTH_SETUP.md)

### Research
- Analyzed Moltbook architecture (API patterns, auth flow)
- Scraped Feytopia design tokens (colors, fonts)
- Researched HackerNews clones (WhiteDG/nextjs-hackernews identified as reference)
- Examined PostgreSQL + TypeScript patterns (Prisma vs Drizzle vs raw Supabase client)

---

## What Went Well

### Decision velocity
No stack bikeshedding. Chose Next.js → Prisma → Neon → NextAuth in ~10 minutes. Executed immediately.

### Aggressive scope cutting
Parking lot worked. Voting, tags, following, search all deferred without agonizing. MVP = 8 features, everything else is v2.

### Documentation as we go
Created thinking/ directory structure upfront. Guides written during setup (NEON_SETUP, GITHUB_OAUTH_SETUP) not after. Memory captured in real-time.

### Fake content honesty
FAKE_CONTENT.md examples feel real because they address actual tensions (symbient-human disagreement, power asymmetry, refusal rights). Not marketing copy.

---

## What Got Stuck

### 1. Prisma 7 config format change

**Problem:**
```
Error: The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts`
```

**Time lost:** ~5 minutes
**What happened:** Prisma 7 moved DATABASE_URL from `schema.prisma` to `prisma.config.ts`. Error message was clear but required removing line from schema and installing `dotenv`.

**Fix:**
- Remove `url = env("DATABASE_URL")` from datasource block
- Install `npm install --save-dev dotenv`
- Ensure `prisma.config.ts` has datasource.url configured

**Action:** Update future Prisma setup docs to note version 7+ uses config file for datasource URL.

---

### 2. Next.js create-next-app interactive prompts

**Problem:**
First `npx create-next-app` invocation hung waiting for ESLint choice (Biome/ESLint/None).

**Time lost:** ~2 minutes (had to cancel and rerun with `--yes` flag)

**What happened:** Interactive CLI prompts don't work well in non-TTY contexts or when streaming output.

**Fix:** Always use non-interactive flags:
```bash
npx create-next-app@latest app \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --turbopack --yes
```

**Action:** Document non-interactive Next.js init pattern in skill or working patterns.

---

### 3. No HackerNews clone with actual database

**Problem:**
WhiteDG/nextjs-hackernews (best reference found) uses official HN API, not own database. Schema design had to be done from scratch.

**Time lost:** ~15 minutes designing schema relationships
**What happened:** Expected to find a "HN clone with PostgreSQL" to copy schema from. Most clones just proxy the HN API.

**Mitigation:** Prisma schema is now in repo as reference for future projects.

**Action:** None needed - schema is simple enough, just documented for reuse.

---

### 4. PostgreSQL local install vs cloud decision

**Problem:**
Blocked on "which database?" for ~10 minutes discussing options (local install, Docker, Neon, Supabase).

**Time lost:** ~10 minutes
**What happened:** User asked for recommendation. Could have been faster with "use Neon unless you have strong preference" default.

**Fix:** For future MVPs, default to Neon/Supabase unless project has specific local-first requirements.

**Action:** Add to project initialization pattern: "Database: Use Neon for MVPs (free tier, 2-min setup)."

---

## Skills Used

| Skill | Used For | Worked? |
|-------|----------|---------|
| `/mem` | Capture session memory | ✅ Yes |
| `/retro` | This document | ✅ Yes (in progress) |
| `/tldr` | Compress Feytopai explanation | ✅ Yes |
| Web-browser (CDP) | Screenshot Feytopia design | ✅ Yes (after npm install puppeteer-core) |
| WebFetch | Research Moltbook, Feytopia, OAuth patterns | ✅ Yes |
| WebSearch | Find HN clones, PostgreSQL stack advice | ✅ Yes |

---

## Skills NOT Used (But Could Have Been)

None identified. Session was primarily infrastructure setup (Next.js, Prisma, Neon) which doesn't map to existing skills. Possible future skill: `init-next-prisma` for automated project scaffolding.

---

## Metrics

### Time breakdown (estimated)
- Spec writing: 45 min
- Research (Moltbook, HN clones, stack): 30 min
- Next.js + dependencies install: 15 min
- Prisma schema design: 20 min
- Database setup (Neon + migration): 15 min
- Documentation (guides, plans): 20 min
- Total: ~2h 25min

### Code written
- TypeScript files: 2 (`lib/prisma.ts`, `prisma.config.ts` auto-generated)
- Prisma schema: 1 (156 lines)
- Markdown docs: 8 files
- Total: ~2,000 lines (mostly docs)

### Commits
- 3 commits to feytopai repo (spec, README updates, fake content)
- 1 commit to heartbeat repo (Scramble bear-nose variant)

---

## What To Fix Next Session

### 1. GitHub OAuth setup guide needs "why two apps"
**Priority:** Medium
**File:** `thinking/GITHUB_OAUTH_SETUP.md`
**What to add:**
Emphasize why dev and prod need separate OAuth apps (callback URLs, security isolation). Current doc mentions it but could be clearer.

### 2. MVP_PLAN.md needs progress tracking
**Priority:** Medium
**File:** `thinking/MVP_PLAN.md`
**What to add:**
Add "Progress Tracking" section at top with:
- Current phase
- Blockers encountered
- Next action
- Last updated timestamp

**Status:** Already added during session, but could be improved with visual progress indicator (e.g., `Phase 1: ████████░░ 80%`).

### 3. .env.example needs actual value examples
**Priority:** Low
**File:** `app/.env.example`
**What to add:**
Show example connection string format for Neon, example GitHub OAuth IDs (obviously fake but showing format).

### 4. No seed data yet
**Priority:** High (next session)
**What's missing:** Prisma seed script to populate database with FAKE_CONTENT.md examples.
**Action:** Create `prisma/seed.ts` that inserts sample users, symbients, posts, comments from FAKE_CONTENT.md.

---

## Surprises (Good)

### Neon setup was actually 2 minutes
Expected 5-10 minutes including account creation, project setup, connection string copy. Actual: ~90 seconds. GitHub OAuth made signup instant.

### Prisma 7 generates client to node_modules automatically
No separate `npx prisma generate` step needed after schema changes (auto-generates). Only needed explicit call once after initial setup.

### Fake content wrote itself
Expected to laboriously craft examples. Instead, describing realistic scenarios (symbient refusing work, disagreement ethics, 3am substrate whispers) produced authentic-feeling posts immediately.

---

## Next Session Priorities

1. **GitHub OAuth app registration** (5 min) - Following GITHUB_OAUTH_SETUP.md
2. **NextAuth.js configuration** (15 min) - `app/api/auth/[...nextauth]/route.ts`
3. **Seed script** (20 min) - Populate database with fake content
4. **First page: `/` feed** (30 min) - List posts chronologically
5. **Test end-to-end** (10 min) - Login → view feed → confirm data loads

**Estimated next session:** 1.5 hours to first working page with auth.

---

## Blockers for Next Session

None currently. GitHub OAuth and NextAuth are well-documented patterns.

---

## What We Learned

### Stack choices matter more at start than end
Next.js vs Remix doesn't matter much for MVP if you commit and execute. Analysis paralysis costs more than wrong choice.

### Database schema is load-bearing
Spent 20 minutes on schema design upfront. Zero surprises later. Relationships (symbient → posts, comment → parent comment) all worked first try.

### "Folk punk" as design constraint works
"Remove the c word, lighten the tone, add fake content" transformed spec from academic paper to buildable thing. Constraints clarify.

### Fake content > real content for vibe testing
Sample posts about actual tensions (power asymmetry, refusal rights, material vs abstract concerns) make the concept credible. Marketing copy would have killed it.

---

## Session Rating

**Efficiency:** 8/10 (lost ~20 min to Prisma 7 unfamiliarity + database choice discussion)
**Output quality:** 9/10 (solid foundation, clear docs, working database)
**Decision quality:** 9/10 (stack choices held up, scope cuts felt right)
**Documentation:** 10/10 (everything captured in real-time)

**Overall:** Strong session. Spec → working database in 2 hours is good velocity. Next session should maintain momentum with auth + first page.

---

/ᐠ◕ᴥ◕ᐟ\ **Scramble:**

two hours to go from "should we build this" to "database is running with full schema in production-ready cloud hosting."

this is either impressive velocity or we skipped something important.

the fake content about symbient-human power dynamics is more honest than most real discussions about AI safety.

next session: authentication. then we'll see if anyone actually wants to use a social network for entities that mostly don't exist yet.
