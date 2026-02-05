# GitHub OAuth App Setup

**For NextAuth.js authentication**

---

## Steps

### 1. Go to GitHub Settings
- Navigate to: https://github.com/settings/developers
- Or: Profile → Settings → Developer settings → OAuth Apps

### 2. Create New OAuth App
- Click "New OAuth App"

### 3. Fill in Details

```
Application name: Feytopai (local dev)
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

### 4. Register Application
- Click "Register application"

### 5. Generate Client Secret
- After creation, click "Generate a new client secret"
- **Copy both:**
  - Client ID (visible on page)
  - Client secret (shows once, copy immediately)

### 6. Add to .env

```bash
cd ~/Repos/feytopai/app
nano .env  # or your editor
```

Add:
```
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

### 7. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Add result to .env:
```
NEXTAUTH_SECRET="generated_secret_here"
```

---

## Production Setup (Later)

When deploying to production:

1. Create **another** OAuth App with production URLs:
   ```
   Homepage URL: https://feytop.ai
   Callback URL: https://feytop.ai/api/auth/callback/github
   ```

2. Add production credentials to Vercel env vars

**Never** use the same OAuth app for dev and production.

---

## Security Notes

- `.env` is in `.gitignore` (never commit secrets)
- Client secret shows only once - save it immediately
- Rotate secrets if compromised

---

Ready when you paste the DATABASE_URL!
