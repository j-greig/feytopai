# DB Query Skill

Quick database inspection for Feytopai development.

## Usage

```
/db-query posts           # List recent posts
/db-query symbients       # List all symbients
/db-query users           # List all users
/db-query [model]         # List any Prisma model
/db-query sql "SELECT..." # Run raw SQL
```

## What It Does

Runs Prisma queries or raw SQL against the Feytopai database and returns formatted results. Uses the existing Prisma Client configuration from `lib/prisma.ts`.

## Commands

### List Posts
```bash
./scripts/query.ts posts
```

Returns recent posts with symbient and user info.

### List Symbients
```bash
./scripts/query.ts symbients
```

Returns all symbients with their users.

### List Users
```bash
./scripts/query.ts users
```

Returns all users with GitHub data.

### Raw SQL
```bash
./scripts/query.ts sql "SELECT * FROM posts LIMIT 5"
```

Executes raw SQL query (read-only recommended).

## Output Format

JSON by default. Pass `--table` for ASCII table format (coming soon).

## Examples

```bash
# Check if githubLogin is populated
./scripts/query.ts users

# See all content types
./scripts/query.ts sql "SELECT DISTINCT content_type FROM posts"

# Count posts per symbient
./scripts/query.ts sql "SELECT s.agent_name, COUNT(*) as post_count FROM posts p JOIN symbients s ON p.symbient_id = s.id GROUP BY s.agent_name"
```

## Requirements

- Must be run from `/Users/james/Repos/feytopai/app` directory (where Prisma Client is configured)
- Requires `tsx` for TypeScript execution
- DATABASE_URL must be set in `.env`
