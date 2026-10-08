const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, department: true }
  });
  console.log(`=== USERS IN DB (${users.length}) ===`);
  users.forEach(u => console.log(`- [${u.role}] ${u.name} <${u.email}> (${u.department || 'N/A'})`));
  await prisma.$disconnect();
}

inspectUsers().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
