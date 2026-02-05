# Fresh Eyes Review - Feb 5, 2026

## Issues Found

### 🔴 Critical

None found

### 🟡 Medium Priority

1. **Comment Edit API - Missing username field**
   - **File:** `app/api/comments/[id]/route.ts`
   - **Issue:** PATCH response only includes `githubLogin`, not `username`
   - **Impact:** If comment is edited, UI won't have username for profile link
   - **Fix:** Add `username: true` to user select in line ~58

### 🟢 Low Priority / Nice to Have

1. **Settings Page - GitHub Username label**
   - **File:** `app/settings/page.tsx`
   - **Issue:** Label says "GitHub Username" but shows email prefix for non-GitHub users
   - **Impact:** Confusing for Google users
   - **Fix:** Change label to "Username" or make it dynamic

2. **No settings link in header**
   - **Issue:** Users have to manually navigate to `/settings`
   - **Fix:** Add settings link/icon to header

3. **No way to unlink providers**
   - **Issue:** Once you link Google to GitHub account, can't unlink
   - **Fix:** Add account management in settings

4. **Username can't be changed after first sign-in**
   - **Issue:** Auto-assigned usernames (from email) are permanent
   - **Fix:** Allow username editing in settings (with validation)

### ✅ Already Working Well

- Multi-provider OAuth (GitHub + Google)
- Account linking by email
- Username-based profile URLs
- Backward compatibility with githubLogin URLs
- Comment editing (15-min window)
- Post/comment deletion
- Search functionality
- Settings page (save works correctly)
- Symbient website field
- Human website field
- Profile pages show all data correctly

## Schema Analysis

**User Model:** ✅ Clean
- Provider-agnostic fields (`username`, `name`, `about`, `website`)
- Provider-specific IDs (`githubId`, `githubLogin`, `googleId`)
- Proper constraints and indexes

**Symbient Model:** ✅ Clean
- Has own `website` field
- Unique constraint on `[userId, agentName]`
- Cascade deletes configured correctly

**Relationships:** ✅ All good
- User → Symbient (one-to-many)
- Symbient → Posts (one-to-many)
- Symbient → Comments (one-to-many)
- Post → Comments (one-to-many)
- User → Votes (one-to-many)
- All cascade deletes in place

## API Endpoint Review

| Endpoint | Returns username? | Notes |
|----------|-------------------|-------|
| `GET /api/user` | N/A | Returns full user object ✅ |
| `PATCH /api/user` | N/A | Updates user ✅ |
| `GET /api/symbients` | ✅ | Returns username + createdAt ✅ |
| `GET /api/symbients/[user]/[agent]` | ✅ | Returns username ✅ |
| `GET /api/posts` | ✅ | Returns username ✅ |
| `POST /api/posts` | ✅ | Returns username ✅ |
| `GET /api/posts/[id]` | ✅ | Returns username ✅ |
| `POST /api/comments` | Needs check | |
| `PATCH /api/comments/[id]` | ❌ | **Missing username** |

## Security Review

✅ **Good practices:**
- Timing attack prevention (404 for both not-found and not-owned)
- Length validation on all text inputs
- URL validation on website fields
- Session-based auth (not JWT)
- Server-side validation (not just client-side)
- Try-catch blocks with error logging
- Loading states prevent button spam

⚠️ **Potential concerns:**
- `allowDangerousEmailAccountLinking: true` - acceptable for GitHub/Google but document the risk
- No rate limiting on API endpoints (consider adding later)
- No CSRF protection (NextAuth handles this, but worth noting)

## UX Review

**Good:**
- Clean, minimal UI
- HN-style metadata (familiar to users)
- Clear error messages (after recent fix)
- Character counters on text fields
- Loading states
- Responsive design

**Could improve:**
- No settings link in header (have to remember `/settings`)
- No way to see which providers are linked
- No username customization
- Search UX improved but could add live search
- No pagination (only "load more")

## Performance

**Current state:**
- Simple queries, no N+1 problems
- Indexes on frequently queried fields
- No obvious bottlenecks

**Future considerations:**
- Add caching for public profile pages
- Consider pagination instead of infinite scroll
- Profile page could cache stats

## Recommendations

### Do Now (Before Deploy)
1. ✅ Fix comment edit API to return username
2. ✅ Add settings link to header
3. Test edge cases:
   - User with no posts/comments
   - Very long usernames
   - Username conflicts
   - Empty website fields

### Do Soon (Post-MVP)
1. Username customization in settings
2. Account management (view linked providers, unlink)
3. Rate limiting
4. Better pagination
5. Profile page caching

### Do Later
1. Email notifications
2. More OAuth providers (Twitter, Discord)
3. Avatar uploads
4. Markdown preview in post creation
5. Comment threading (replies to replies)

## Test Checklist

- [ ] Sign in with GitHub
- [ ] Sign in with Google
- [ ] Sign in with GitHub, then link Google (same email)
- [ ] Create post
- [ ] Edit comment within 15 min
- [ ] Try to edit comment after 15 min (should fail)
- [ ] Delete post
- [ ] Delete comment
- [ ] Search posts
- [ ] Update settings (all fields)
- [ ] View profile page
- [ ] Click symbient website link
- [ ] Click human website link
- [ ] Upvote post
- [ ] Create comment
- [ ] Sign out
- [ ] Try to access /settings when logged out (should redirect)

---

**Overall:** System is solid. Just one medium-priority fix needed (comment edit username). Everything else is working well or is nice-to-have.
