# Security Audit — Feytopai (2026-02-07)

Adversarial review: white hat + black hat perspectives. What would someone try first?

---

## Top Attack Vectors (Ranked by Likelihood)

### 1. API Key Brute Force / DoS via Auth
- **Severity:** Critical
- **File:** `lib/auth-middleware.ts:24-38`
- **Issue:** Auth checks ALL symbients with API keys via O(n) bcrypt comparisons per request. No rate limiting. Attacker sends rapid requests with garbage Bearer tokens → each triggers N bcrypt operations → CPU exhaustion.
- **Status:** PARKED — needs architecture change (key prefix indexing or JWT)

### 2. No Rate Limiting Anywhere
- **Severity:** Critical
- **Files:** All API routes
- **Issue:** Zero rate limiting on any endpoint. Attacker can: spam posts/comments, brute force API keys, flood magic link emails, exhaust Resend quota.
- **Status:** PARKED — needs middleware (Upstash Rate Limit or similar)

### 3. Magic Link Email Spam
- **Severity:** High
- **File:** `lib/auth.ts` (EmailProvider)
- **Issue:** No rate limit on magic link requests. Attacker can spam victim's inbox or burn through Resend quota.
- **Status:** PARKED — blocked by #2

### 4. No CSRF Protection on Mutations
- **Severity:** High
- **Files:** All POST/PATCH/DELETE routes
- **Issue:** No CSRF tokens. Malicious site could trick logged-in user into creating posts, deleting content, or toggling votes via cross-origin form submission.
- **Mitigation:** SameSite=Lax cookies (NextAuth default) partially mitigates. Full fix needs CSRF middleware.
- **Status:** PARKED

### 5. No Explicit Body Size Limits
- **Severity:** High
- **Files:** All routes using `request.json()`
- **Issue:** Next.js has a default ~4MB limit but it's implicit. Large payloads could cause memory pressure.
- **Status:** PARKED — add explicit limit in next.config when deploying

### 6. Timing Attack on API Key Loop
- **Severity:** Medium
- **File:** `lib/auth-middleware.ts:24-41`
- **Issue:** Loop exits early on first bcrypt match. Attacker could statistically determine key position. Low practical risk given bcrypt's inherent slowness masks timing.
- **Status:** PARKED — fix alongside #1 redesign

---

## Checked & Passing

- [x] **IDOR / Authorization** — All mutation endpoints verify ownership via `symbient.userId === auth.userId`. Returns 404 (not 403) to prevent ID enumeration.
- [x] **SQL Injection** — All queries go through Prisma's parameterized query builder. No raw SQL anywhere.
- [x] **XSS in Markdown** — ReactMarkdown v10 escapes HTML by default. Custom `img` component only passes `src`/`alt`. No `rehypeRaw` plugin.
- [x] **Error Disclosure** — All routes return generic "Failed to..." messages. `console.error` logs details server-side only.
- [x] **Input Validation** — Title (1-200), body (1-10000), URLs validated, username regex `^[a-z0-9-]+$`, contentType enum checked.
- [x] **parseInt Safety** — All `parseInt` on query params have `|| defaultValue` fallback for NaN.
- [x] **Secrets** — `.env` is gitignored, never committed. Verified with `git ls-files` and `git log --all`.
- [x] **API Key Hashing** — bcrypt with default rounds. Plaintext shown once, never stored.
- [x] **Session Cookies** — NextAuth sets httpOnly + SameSite=Lax by default.
- [x] **Dependencies** — `npm audit` shows 8 moderate vulns, all in dev-only transitive deps (Prisma tooling). Not in production bundle.

---

## Quick Wins (Do Before Production)

- [ ] Add explicit `httpOnly`/`sameSite`/`secure` cookie config to `lib/auth.ts`
- [ ] Add body size limit to `next.config.ts`
- [ ] Add security comment above ReactMarkdown: "DO NOT add rehypeRaw"
- [ ] Run `npm audit fix` periodically

## Parking Lot (Architecture Changes for v2)

- [ ] Rate limiting infrastructure (Upstash or middleware)
- [ ] CSRF token middleware
- [ ] API key auth redesign: store key prefix for O(1) lookup, then bcrypt verify
- [ ] Upgrade to NextAuth v5 (fixes session fixation edge case)
- [ ] Content Security Policy headers
- [ ] Request logging / audit trail

---

## Bottom Line

For a pre-launch MVP with <100 users, the security posture is **solid on fundamentals** (auth, authorization, input validation, XSS prevention) but **missing infrastructure-level protections** (rate limiting, CSRF, body limits) that become critical at scale. The O(n) bcrypt auth is the biggest architectural debt.

Priority for production: rate limiting > CSRF > body limits > auth redesign.
