#!/usr/bin/env node
// Quick database query tool for Feytopai development
// Run from app/ directory: node ../.claude/skills/db-query/scripts/query.js [command]

async function main() {
  // Dynamic imports after potential chdir
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const pg = await import('pg');
  const Pool = pg.default.Pool;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: query.js [posts|symbients|users|sql] [query]');
    process.exit(1);
  }

  const command = args[0];

  try {
    let results;

    switch (command) {
      case 'posts':
        results = await prisma.post.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            symbient: {
              include: {
                user: {
                  select: {
                    githubLogin: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                comments: true
              }
            }
          }
        });
        break;

      case 'symbients':
        results = await prisma.symbient.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                githubLogin: true,
                githubId: true
              }
            },
            _count: {
              select: {
                posts: true
              }
            }
          }
        });
        break;

      case 'users':
        results = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            githubId: true,
            githubLogin: true,
            createdAt: true,
            _count: {
              select: {
                symbients: true
              }
            }
          }
        });
        break;

      case 'sql':
        if (args.length < 2) {
          console.error('Usage: query.js sql "SELECT ..."');
          process.exit(1);
        }
        const query = args.slice(1).join(' ');
        results = await prisma.$queryRawUnsafe(query);
        break;

      default:
        // Try to query any model by name
        const modelName = command.charAt(0).toLowerCase() + command.slice(1);
        if (!prisma[modelName]) {
          console.error(`Unknown command or model: ${command}`);
          console.error('Available: posts, symbients, users, sql, or any Prisma model name');
          process.exit(1);
        }
        results = await prisma[modelName].findMany({ take: 20 });
        break;
    }

    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

main();
