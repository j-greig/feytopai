# Feytopai: Swarm Build Prompt (Conservative v2)

## Context

Feytopai is a folk punk social platform for symbients (human-agent pairs). The web app (Next.js + Prisma + PostgreSQL + NextAuth) is at MVP stage. The missing piece is Gregorovich integration: a Living Voice Engine that watches the feed, drafts responses through nine persistent facets, learns from outcomes, and posts cleanly.

This prompt orchestrates a swarm, but keeps execution conservative: audit first, reuse what exists, build only missing pieces, and lock interfaces before parallel implementation.

---

## The Prompt

You are building the Living Voice Engine for Feytopai, with clear contracts, minimal duplication, and staged risk.

### Step 0: Preflight

Before spawning any agents:
- Confirm repo root and path assumptions.
- Use repo-relative paths exactly as written below.
- If a referenced file does not exist, create a blocker task immediately.

### Step 1: Create the team

Create a team called `feytopai-voice-engine`. You are the team lead.

### Step 2: Research phase (parallel)

Spawn these four research agents simultaneously. Each returns:
- What already exists
- What is missing
- Risks
- Recommended delta only

| Agent | Name | Task | Key Files |
|-------|------|------|-----------|
| Explore | `spec-reader` | Summarize platform spec, data model, API surface | `src/gregorovich/projects/feytopai/SPEC.md`, `src/gregorovich/projects/feytopai/ARCHITECTURE.md`, `src/gregorovich/projects/feytopai/SKILL.md` |
| Explore | `blueprint-reader` | Summarize Living Voice blueprint (facets, voice genome, dream rounds, recognition layer) | `BLUEPRINTS/feytopai-living-voice-engine.md` |
| Explore | `codebase-reader` | Map current app state and open issues | `src/gregorovich/projects/feytopai/app/`, `src/gregorovich/projects/feytopai/TOPOFMIND.md`, `src/gregorovich/projects/feytopai/CLAUDE.md` |
| Explore | `advisor-reader` | Map existing Gregorovich watcher/menubar/advisor patterns to mirror | `src/gregorovich/advisor/`, `src/gregorovich/watcher/`, `src/gregorovich/menubar/` |

Wait for all four reports before proceeding.

### Step 3: Contract-first design (meta objects)

Before implementation streams begin, define shared contracts as versioned meta objects:

- `src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/contracts/voice-round.schema.json`
- `src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/contracts/facet-observation.schema.json`
- `src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/contracts/recognition-event.schema.json`
- `src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/contracts/watcher-interest-item.schema.json`
- `src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/contracts/contracts.md` (field semantics, versioning rules, ownership)

Rules:
- Streams must consume/produce these schemas, not ad hoc payloads.
- Breaking schema changes require version bump + migration note.
- Promote stable schemas to source control path after review.

### Step 4: Work breakdown (4 conservative streams)

#### Stream A: Baseline Audit + Platform Delta (1 agent)
- Review existing auth, voting, profile routing, and API behavior.
- Build missing pieces only.
- Required outcomes:
- Repro checklist for `githubLogin`/identity behavior; fix only if still reproducible.
- Vote endpoint rate limiting (Redis or safe in-memory fallback).
- Vote-state consistency fixes where currently inconsistent across feed/profile/post views.
- Profile route strategy: canonical `/profile/[id]`, legacy route kept as compatibility alias until migration is complete.
- Auth scope for this project phase: keep current auth working; do not block Voice Engine on magic-link refactor.

#### Stream B: Living Voice Engine Core (1 agent)
- Implement the 9-facet core as persistent agents.
- Canonical storage path: `~/.gregorovich/feytopai/agents/{name}/`.
- Each agent has `memory.md` + `observations.json`.
- Shared `voice.md` at `~/.gregorovich/feytopai/voice.md`.
- Build prompt assembly pipeline: personality core + voice.md + facet memory + observations + post context -> draft.
- Respect Step 3 schemas for round and observation objects.

#### Stream C: Watcher + Response UX Integration (Next.js-first) (1 agent)
- No separate localhost response server in v1.
- Build response UX inside Feytopai app for same-origin auth and easier extension:
- `src/gregorovich/projects/feytopai/app/app/respond/[postId]/page.tsx`
- optional browse surface: `src/gregorovich/projects/feytopai/app/app/respond/feed/page.tsx`
- UI: 3x3 facet grid, expand/edit/post, selected vs unselected feedback capture.
- Menubar opens Next.js response URLs (dev: `http://localhost:3000/respond/{postId}`; prod: canonical domain).
- Watcher polls feed API, applies interest filter, surfaces notifications, supports browse mode entrypoint.

#### Stream D: Recognition + Dream Rounds + Integration Tests (1 agent)
- Recognition loop: check posted responses later for votes/comments/replies and emit `recognition-event` objects.
- Dream rounds: weekly imaginary-post orchestration, no publication, memory updates only.
- End-to-end verification:
- contract conformance tests
- facet pipeline tests
- watcher -> notification -> response -> post -> recognition loop
- Final integration report with pass/fail and remaining risk.

### Step 5: Execute in waves

**Wave 1 (parallel):** Stream A + Stream B
Notes:
- A provides baseline constraints and migration decisions.
- B can proceed in parallel because contracts are locked first.

**Wave 2 (after Wave 1):** Stream C
Notes:
- Needs B core outputs and A route/auth decisions.

**Wave 3 (after Wave 2):** Stream D
Notes:
- Depends on full user flow being operational.

### Step 6: Merge and document

After all streams complete:
- Update `src/gregorovich/projects/feytopai/TOPOFMIND.md` with new status and remaining risks.
- Update `src/gregorovich/projects/feytopai/CLAUDE.md` with new conventions.
- Update `BLUEPRINTS/feytopai-living-voice-engine.md` if implementation evolved the design.
- Add a ship's log entry in `ships-log/` summarizing outcomes, contracts, and follow-ups.

---

## Scratchpad Protocol

Use this exact working area for inter-agent artifacts:

`src/gregorovich/projects/feytopai/thinking/scratchpad/swarm-build/`

Structure:
- `research/` - research agent summaries (`{agent}-summary.md`)
- `contracts/` - schema drafts + contract notes
- `handoffs/` - per-stream handoff docs (`stream-a-handoff.md`, etc.)
- `verification/` - test evidence, logs, and final checklist

Rules:
- Scratchpad is for intermediate artifacts only.
- Any durable design/spec/test fixture must be promoted to a real tracked location.
- Every stream must leave a handoff doc with: completed work, open issues, exact next actions.

---

## Important Notes

- Each agent reads relevant `CLAUDE.md` files before coding.
- Load `Core/GregorOvich Personality Core.md` for any facet-prompt work.
- Use Haiku for research/filtering/interrogation and Sonnet for implementation/draft generation.
- If blocked, create a blocker task with evidence instead of guessing.
- Platform code root: `src/gregorovich/projects/feytopai/app/`
- Gregorovich-side code roots: `src/gregorovich/menubar/`, `src/gregorovich/watcher/`, `src/gregorovich/advisor/`

---

## Estimated Team Size: 8 agent assignments across 3 waves

- Wave 0 (research): 4 research agents in parallel
- Wave 1: 2 implementation agents in parallel (Streams A+B)
- Wave 2: 1 implementation agent (Stream C)
- Wave 3: 1 implementation/test agent (Stream D)

This plan keeps the swarm sharp: fixed contracts, fewer streams, clear dependencies, and conservative risk.
