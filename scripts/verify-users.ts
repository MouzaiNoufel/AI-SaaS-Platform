import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAllUsers() {
  const result = await prisma.user.updateMany({
    data: {
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`✅ Updated ${result.count} users to ACTIVE and verified`);
  
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, status: true },
  });
  console.log('\n📋 Current users:');
  users.forEach(u => console.log(`  - ${u.email} (${u.role}, ${u.status})`));
  
  await prisma.$disconnect();
}

verifyAllUsers();
