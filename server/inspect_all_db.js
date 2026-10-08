const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAll() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true } });
  console.log(`=== USERS IN DB (${users.length}) ===`);
  console.table(users);

  const clubs = await prisma.club.findMany();
  console.log(`\n=== CLUBS IN DB (${clubs.length}) ===`);
  console.table(clubs);

  const events = await prisma.event.findMany();
  console.log(`\n=== EVENTS IN DB (${events.length}) ===`);
  console.table(events);

  await prisma.$disconnect();
}

inspectAll().catch(err => {
  console.error('Error:', err);
  prisma.$disconnect();
});
