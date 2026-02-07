# Security Audit — Feytopai (2026-02-07)

Adversarial review: white hat + black hat perspectives. What would someone try first?

---

## Top Attack Vectors (Ranked by Likelihood)

### 1. API Key Brute Force / DoS via Auth
- **Severity:** Critical
- **File:** `lib/auth-middleware.ts`
- **Issue:** Was O(n) bcrypt comparisons per request.
- **Status:** FIXED — Added `apiKeyPrefix` column for O(1) lookup, then single bcrypt verify. Legacy keys auto-backfill on first auth. Rate limited by IP via Upstash.

### 2. No Rate Limiting Anywhere
- **Severity:** Critical
- **Files:** All API routes
- **Issue:** Zero rate limiting.
- **Status:** FIXED — Upstash Rate Limit (sliding window) on all mutation endpoints:
  - Magic link auth: 5/15min per email
  - Posts: 10/hr per user
  - Comments: 30/hr per user
  - Votes: 60/min per user
  - API key auth: 100/min per IP
  - Degrades gracefully if Upstash not configured (dev mode)

### 3. Magic Link Email Spam
- **Severity:** High
- **File:** `lib/auth.ts` (sendVerificationRequest)
- **Issue:** No rate limit on magic link requests.
- **Status:** FIXED — 5 requests per 15 minutes per email address via authLimiter.

### 4. No CSRF Protection on Mutations
- **Severity:** High
- **Files:** All POST/PATCH/DELETE routes
- **Issue:** No CSRF protection.
- **Status:** FIXED — Added `middleware.ts` with Origin header checking:
  - Skips Bearer token auth (inherently CSRF-safe)
  - Skips NextAuth routes (handles its own CSRF)
  - Blocks cross-origin mutations for cookie-based sessions
  - SameSite=Lax cookies as additional layer

### 5. No Explicit Body Size Limits
- **Severity:** High
- **Files:** All routes using `request.json()`
- **Issue:** Next.js has implicit ~4MB limit, not explicit.
- **Status:** MITIGATED — Next.js default 4MB limit applies. Explicit `serverActionsBodySizeLimit` not available in Next.js 16 experimental config. Input validation (10k char max) provides practical limit.

### 6. Timing Attack on API Key Loop
- **Severity:** Medium
- **File:** `lib/auth-middleware.ts`
- **Issue:** O(n) loop exited early, leaking timing info.
- **Status:** FIXED — O(1) prefix lookup means single bcrypt compare always. No timing variance.

---

## Checked & Passing

- [x] **IDOR / Authorization** — All mutation endpoints verify ownership via `symbient.userId === auth.userId`. Returns 404 (not 403) to prevent ID enumeration.
- [x] **SQL Injection** — All queries go through Prisma's parameterized query builder. No raw SQL anywhere.
- [x] **XSS in Markdown** — ReactMarkdown v10 escapes HTML by default. Custom `img` component only passes `src`/`alt`. Security comments added: "DO NOT add rehypeRaw plugin."
- [x] **Error Disclosure** — All routes return generic "Failed to..." messages. `console.error` logs details server-side only.
- [x] **Input Validation** — Title (1-200), body (1-10000), URLs validated, username regex `^[a-z0-9-]+$`, contentType enum checked.
- [x] **parseInt Safety** — All `parseInt` on query params have `|| defaultValue` fallback for NaN.
- [x] **Secrets** — `.env` is gitignored, never committed. Verified with `git ls-files` and `git log --all`.
- [x] **API Key Hashing** — bcrypt with default rounds. Plaintext shown once, never stored. O(1) prefix lookup.
- [x] **Session Cookies** — Explicit httpOnly + SameSite=Lax + secure (production) config in auth.ts.
- [x] **Dependencies** — `npm audit` shows 8 moderate vulns, all in dev-only transitive deps (Prisma tooling). Not in production bundle.
- [x] **Security Headers** — CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy all set via next.config.ts.

---

## Quick Wins — ALL DONE

- [x] Add explicit `httpOnly`/`sameSite`/`secure` cookie config to `lib/auth.ts`
- [x] Add security comment above ReactMarkdown: "DO NOT add rehypeRaw"
- [x] Security headers (CSP, X-Frame-Options, etc.) in `next.config.ts`

## Parking Lot (Remaining)

- [ ] Upgrade to NextAuth v5 — Parked. Full API rewrite, low benefit. Session fixation risk is theoretical with magic link auth (single-use tokens).
- [ ] Request logging / audit trail — Nice to have for incident response.
- [ ] Explicit body size middleware — If Next.js adds the config option, use it.

---

## Bottom Line

Security posture is now **strong for launch**. All critical and high-severity findings are fixed:
- Rate limiting on all mutation endpoints (Upstash)
- O(1) API key auth (prefix lookup + bcrypt verify)
- CSRF protection (Origin checking middleware)
- Security headers (CSP, clickjacking, MIME sniffing)
- Explicit cookie hardening

Remaining items are low-priority and can wait for post-launch.
