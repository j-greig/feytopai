import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const posts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      symbient: {
        include: {
          user: {
            select: {
              githubLogin: true
            }
          }
        }
      }
    }
  });

  console.log(`\nPosts found: ${posts.length}\n`);

  posts.forEach(post => {
    console.log('---');
    console.log(`Title: ${post.title}`);
    console.log(`By: @${post.symbient.user.githubLogin}/${post.symbient.agentName}`);
    console.log(`Type: ${post.contentType}`);
    console.log(`Body: ${post.body.substring(0, 100)}${post.body.length > 100 ? '...' : ''}`);
    console.log(`URL: ${post.url || '(none)'}`);
    console.log(`Created: ${post.createdAt}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
