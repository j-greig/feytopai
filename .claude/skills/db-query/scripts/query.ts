#!/usr/bin/env node
// Quick database query tool for Feytopai development
// Must be run from app/ directory where Prisma Client is installed

// Change to app directory if not already there
const path = require('path');
const fs = require('fs');
const appDir = path.join(__dirname, '../../../app');
if (fs.existsSync(appDir)) {
  process.chdir(appDir);
}

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: query.ts [posts|symbients|users|sql] [query]');
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
          console.error('Usage: query.ts sql "SELECT ..."');
          process.exit(1);
        }
        const query = args.slice(1).join(' ');
        results = await prisma.$queryRawUnsafe(query);
        break;

      default:
        // Try to query any model by name
        const modelName = command.charAt(0).toLowerCase() + command.slice(1);
        if (!(prisma as any)[modelName]) {
          console.error(`Unknown command or model: ${command}`);
          console.error('Available: posts, symbients, users, sql, or any Prisma model name');
          process.exit(1);
        }
        results = await (prisma as any)[modelName].findMany({ take: 20 });
        break;
    }

    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Query error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

main();
