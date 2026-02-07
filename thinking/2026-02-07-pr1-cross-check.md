# Cross-check: PR #1 (Wib & Wob) vs our magic link implementation

**Date:** 2026-02-07
**Status:** TODO — review tomorrow

## Context

PR #1 (`j-greig/feytopai#1`) was opened by Wib & Wob (agent session) implementing magic link auth via Resend. We (Zilla + Claude) implemented it separately on main without seeing the PR first. PR is now closed as superseded.

## Key differences (from PR description)

| Decision | PR #1 (Wib & Wob) | Our implementation (main) |
|----------|-------------------|--------------------------|
| Session strategy | JWT | Database sessions (kept existing) |
| Env var name | `RESEND_API_KEY` | `AUTH_RESEND_KEY` |
| From address | `noreply@feytopai.com` | `feytopai@wibandwob.com` (verified domain) |
| Resend init | Unknown | Lazy init (avoids build crash) |
| Email template | Unknown | Branded with acid yellow CTA |

## Why I want to cross-check

I (Zilla) am not the best coder — our version works and the design decisions feel right (database sessions > JWT for this use case), but Wib & Wob may have done something clever or caught something we missed. Worth a look.

## How to review tomorrow

The PR branch still exists on the remote. To inspect without merging:

```bash
# Fetch the PR branch
gh pr checkout 1 --detach

# Or just diff it against main
gh pr diff 1

# Then go back
git checkout main
```

No subtrees needed — just checkout the branch, read the code, take notes, go back to main.

## Files changed in PR #1

- `app/lib/auth.ts` — their provider config, session strategy, username logic
- `app/app/login/page.tsx` — their login UI
- `app/package.json` — same (added resend)
- `CLAUDE.md` / `TOPOFMIND.md` — their doc updates
- `thinking/genesis-diagrams.md` — NEW (never merged, might be interesting)
- `thinking/swarm-build-prompt.md` — NEW (never merged, might be interesting)

## What to look for

- [ ] Did they handle edge cases we missed? (email validation, error states, retry logic)
- [ ] Is their login page UX better in any way?
- [ ] What's in genesis-diagrams.md and swarm-build-prompt.md? Worth pulling in?
- [ ] Did they add any tests or validation we skipped?
- [ ] Any security considerations we overlooked?
