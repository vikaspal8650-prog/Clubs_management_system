const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const clubs = await prisma.club.findMany();
  console.log('All Clubs in DB:', clubs.map(c => ({ id: c.id, name: c.name, department: c.department })));

  const turingClub = clubs.find(c => c.name.toLowerCase().includes('turing') || c.name.toLowerCase().includes('coding'));
  if (!turingClub) {
    console.log('Turing club not found by name substring search!');
    await prisma.$disconnect();
    return;
  }

  console.log('\nFound Turing Club:', turingClub);

  const coordinators = await prisma.clubCoordinator.findMany({ where: { clubId: turingClub.id } });
  console.log('Coordinators count:', coordinators.length);

  const members = await prisma.clubMember.findMany({ where: { clubId: turingClub.id } });
  console.log('Members count:', members.length);

  const events = await prisma.event.findMany({ where: { clubId: turingClub.id } });
  console.log('Events count:', events.length, events.map(e => ({ id: e.id, title: e.title })));

  const eventIds = events.map(e => e.id);

  if (eventIds.length > 0) {
    const approvals = await prisma.eventApproval.findMany({ where: { eventId: { in: eventIds } } });
    console.log('Event Approvals count:', approvals.length);

    const registrations = await prisma.eventRegistration.findMany({ where: { eventId: { in: eventIds } } });
    console.log('Event Registrations count:', registrations.length);

    const attendances = await prisma.attendance.findMany({ where: { eventId: { in: eventIds } } });
    console.log('Attendances count:', attendances.length);

    const documents = await prisma.document.findMany({ where: { eventId: { in: eventIds } } });
    console.log('Documents count:', documents.length);
  }

  await prisma.$disconnect();
}

inspect().catch(err => {
  console.error('Inspect error:', err);
  prisma.$disconnect();
});
