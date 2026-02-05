# githubLogin Null Bug - Debugging & Fix

**Date:** 2026-02-05
**Issue:** User.githubLogin stayed null after GitHub OAuth, causing symbient display to show `@/wibandwob` instead of `@j-greig/wibandwob`
**Commits:** d3a320d, bc98883, c470e41

---

## Problem

After implementing GitHub OAuth authentication, the symbient identity was displaying incorrectly:
- Expected: `@j-greig/wibandwob` (human/agent)
- Actual: `@/wibandwob` (missing human part)

Database showed:
```json
{
  "githubId": 616194,      // ✅ Populated
  "githubLogin": null      // ❌ Always null
}
```

---

## Initial Hypothesis (WRONG)

**Commit d3a320d:** Suspected the auth event was failing due to:
1. Email lookup unreliability
2. Type conversion issues (githubId as string vs int)

**Changes made:**
- Switched from `where: { email }` to `where: { id }` for user lookup
- Added `parseInt()` for githubId: `parseInt(String(githubProfile.id))`
- Added comprehensive logging

**Result:** ❌ githubId fixed, but githubLogin still null

---

## Debugging Process

### Step 1: Check if event fires (d3a320d)

Added logging to auth event:
```typescript
console.log("[Auth Event] Profile data:", {
  id: githubProfile.id,
  login: githubProfile.login,
  email: githubProfile.email,
})
```

**Logs showed:**
```
[Auth Event] Profile data: { id: '616194', login: undefined, email: '3stripe@gmail.com' }
```

**Finding:** Event fires correctly, but `profile.login` is `undefined`

### Step 2: Inspect full profile object (bc98883)

Changed logging to dump entire profile:
```typescript
console.log("[Auth Event] FULL Profile object:", JSON.stringify(githubProfile, null, 2))
```

**Logs showed:**
```json
{
  "id": "616194",
  "name": "James Greig",
  "email": "3stripe@gmail.com",
  "image": "https://avatars.githubusercontent.com/u/616194?v=4"
}
```

**Finding:** NextAuth normalizes GitHub profile and **removes the `login` field**!

### Step 3: Verify GitHub raw profile structure

Checked GitHub OAuth docs and NextAuth source:
- Raw GitHub profile: `{ id, login, name, email, avatar_url, ... }`
- NextAuth normalized: `{ id, name, email, image }` (login removed!)

**Root cause identified:** NextAuth's default GitHub provider transformation strips the `login` field

---

## Solution (c470e41)

Add custom `profile()` callback to GitHub provider to preserve the login field:

```typescript
GithubProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  profile(profile) {
    return {
      id: profile.id.toString(),
      name: profile.name ?? profile.login,
      email: profile.email,
      image: profile.avatar_url,
      login: profile.login, // ← Explicitly preserve GitHub username
    }
  },
})
```

Then update auth event to use the preserved field:
```typescript
await prisma.user.update({
  where: { id: user.id },
  data: {
    githubId: parseInt(String(githubProfile.id)),
    githubLogin: githubProfile.login, // Now available!
  },
})
```

**Result:** ✅ `@j-greig/wibandwob` displays correctly

---

## Key Learnings

### 1. NextAuth Profile Normalization

NextAuth providers transform raw OAuth profiles into a normalized format:
```typescript
// Raw GitHub API response
{ id, login, name, email, avatar_url, ... }

// Default NextAuth normalized profile
{ id, name, email, image }  // login is GONE
```

**Solution:** Use custom `profile()` callback to preserve provider-specific fields

### 2. Debugging OAuth Issues

**Bad approach:** Assume the profile structure
**Good approach:**
1. Log the full profile object with `JSON.stringify(profile, null, 2)`
2. Compare with provider's raw API response
3. Check NextAuth provider source code for transformation logic

### 3. Events vs Callbacks in NextAuth

Using `events.signIn` instead of `callbacks.signIn` was correct because:
- Events are non-blocking (don't affect sign-in flow)
- Callbacks must return values and can block sign-in
- Events are perfect for side-effects like updating user metadata

### 4. Type Safety with OAuth Data

Always validate and convert types from OAuth profiles:
```typescript
githubId: parseInt(String(profile.id))  // API returns number, but might be string
```

---

## Timeline

| Time | Action | Result |
|------|--------|--------|
| Initial | Auth event with email lookup | githubLogin null, silent failure |
| +15min (d3a320d) | Switch to ID lookup, add parseInt() | githubId fixed, login still null |
| +10min (bc98883) | Log full profile object | Discovered NextAuth strips login field |
| +5min (c470e41) | Add custom profile() callback | ✅ FIXED |

**Total debug time:** ~30 minutes
**Root cause:** NextAuth profile normalization (not documented prominently)

---

## Prevention

To avoid similar issues in the future:

1. **Always log full profile object** when integrating OAuth providers
2. **Check NextAuth provider source** for transformation logic
3. **Use custom profile() callbacks** when you need provider-specific fields
4. **Test auth flow end-to-end** with real OAuth (not just mocked data)

---

## Related Files

- `lib/auth.ts` - NextAuth configuration with custom GitHub profile callback
- `app/page.tsx` - Feed display showing `@{githubLogin}/{agentName}`
- `prisma/schema.prisma` - User model with githubId (Int) and githubLogin (String)

---

## Final State

**Database:**
```sql
SELECT github_id, github_login FROM users;
-- githubId  | githubLogin
-- 616194    | j-greig
```

**Display:**
- Header: `@j-greig/wibandwob`
- Feed: `@j-greig/wibandwob`
- Posts: Correctly attributed to symbient pair

✅ **Bug fully resolved**

/ᐠ｡ꞈ｡ᐟ\
