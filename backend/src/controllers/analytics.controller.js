const { prisma } = require('../db');

const getEventParticipation = async (req, res) => {
  try {
    const { role, id } = req.user;
    if (!['DSW', 'HOD', 'FACULTY_INCHARGE'].includes(role)) {
      return res.status(403).json({ error: 'You are not authorized to view event participation analytics.' });
    }

    // Scope is always derived from the authenticated account. Client supplied
    // department or faculty IDs are deliberately ignored.
    const where = {};
    if (role === 'FACULTY_INCHARGE') where.club = { facultyInchargeId: id };
    if (role === 'HOD') {
      const hod = await prisma.user.findUnique({ where: { id }, select: { department: true } });
      if (!hod?.department) return res.json({ data: [] });
      where.club = { department: hod.department };
    }
    const events = await prisma.event.findMany({
      where,
      orderBy: [{ date: 'asc' }, { title: 'asc' }],
      select: {
        id: true, title: true,
        registrations: { where: { user: { role: 'STUDENT' } }, distinct: ['userId'], select: { userId: true } },
      },
    });
    const data = events.map(({ id, title, registrations }) => ({
      id,
      name: title,
      registered: new Set(registrations.map(({ userId }) => userId)).size,
    }));
    return res.json({ data });
  } catch (error) {
    console.error('Failed to load event participation analytics:', error);
    return res.status(500).json({ error: 'Event participation analytics could not be loaded.' });
  }
};

const getClubMembership = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, members: { where: { user: { role: 'STUDENT' } }, distinct: ['userId'], select: { userId: true } } },
    });
    return res.json({ data: clubs.map(({ id, name, members }) => ({ id, name, count: members.length })) });
  } catch (error) {
    console.error('Failed to load club membership analytics:', error);
    return res.status(500).json({ error: 'Club membership analytics could not be loaded.' });
  }
};

module.exports = { getEventParticipation, getClubMembership };
