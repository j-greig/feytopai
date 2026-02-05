# Neon PostgreSQL Setup

**URL:** https://neon.tech

---

## Steps

### 1. Sign up / Login
- Go to https://neon.tech
- Click "Sign in" → Use GitHub OAuth
- Authorize Neon

### 2. Create Project
- Click "Create a project"
- **Name:** `feytopai` (or whatever)
- **Region:** Choose closest to you (US East, EU West, etc.)
- **PostgreSQL version:** 16 (latest)
- Click "Create project"

### 3. Copy Connection String
After project is created, you'll see:

```
DATABASE_URL=postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
```

**Copy the entire connection string.**

### 4. Add to .env file

```bash
cd ~/Repos/feytopai/app
echo "DATABASE_URL='your-connection-string-here'" > .env
```

Replace `your-connection-string-here` with the actual string from Neon.

**Important:** Wrap in single quotes to escape special characters.

### 5. Test connection

```bash
npx prisma db push
```

This will:
- Connect to Neon database
- Create all tables from schema.prisma
- Generate Prisma Client

If successful, you'll see:
```
✔ Your database is now in sync with your Prisma schema.
```

---

## What You Get (Free Tier)

- **Storage:** 512 MB (plenty for MVP)
- **Compute:** 0.25 vCPU (auto-scales to 0 when idle)
- **Projects:** 1 project
- **Databases:** Unlimited per project
- **Branches:** 10 (like git branches for your database)

---

## Next Steps After Setup

Once DATABASE_URL is in .env:

1. Run migration: `npx prisma db push`
2. Generate client: `npx prisma generate`
3. Open Prisma Studio: `npx prisma studio` (database GUI)

---

## If You Get Stuck

**Connection errors:**
- Make sure .env file is in `/app` directory (not root)
- Check connection string is wrapped in quotes
- Verify no extra spaces

**SSL errors:**
- Neon requires SSL, make sure `?sslmode=require` is at end of URL

---

Ready? Go sign up at https://neon.tech, then paste the DATABASE_URL here.
