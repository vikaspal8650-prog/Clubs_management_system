const { prisma } = require('../db');

// Get all clubs
const getClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        facultyIncharge: { select: { id: true, name: true, email: true } },
        coordinators: { where: { status: 'ACTIVE' }, include: { user: { select: { id: true, name: true } } } },
        members: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    const formatted = await Promise.all(clubs.map(async (c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      department: c.department,
      category: 'Technical',
      facultyInchargeId: c.facultyInchargeId,
      facultyInchargeName: c.facultyIncharge ? c.facultyIncharge.name : 'Unassigned',
      coordinators: c.coordinators.map(coord => ({ id: coord.user.id, name: coord.user.name })),
      // Only expose the requesting user's membership state; aggregate count remains available.
      members: c.members.filter((m) => m.user.id === req.user.id).map(m => ({ id: m.user.id, name: m.user.name })),
      memberCount: await prisma.clubMember.count({ where: { clubId: c.id } }),
      activeEventsCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    })));

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch clubs:', err.message);
    res.status(500).json({ error: 'Failed to fetch clubs.' });
  }
};

// Get single club
const getClubById = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await prisma.club.findUnique({
      where: { id },
      include: {
        facultyIncharge: { select: { id: true, name: true, email: true } },
        coordinators: { where: { status: 'ACTIVE' }, include: { user: { select: { id: true, name: true } } } },
        members: { include: { user: { select: { id: true, name: true } } } }
      }
    });
    if (!c) return res.status(404).json({ error: 'Club not found' });

    const formatted = {
      id: c.id,
      name: c.name,
      description: c.description,
      department: c.department,
      category: 'Technical',
      facultyInchargeId: c.facultyInchargeId,
      facultyInchargeName: c.facultyIncharge ? c.facultyIncharge.name : 'Unassigned',
      coordinators: c.coordinators.map(coord => ({ id: coord.user.id, name: coord.user.name })),
      // Only expose the requesting user's membership state; aggregate count remains available.
      members: c.members.filter((m) => m.user.id === req.user.id).map(m => ({ id: m.user.id, name: m.user.name })),
      memberCount: await prisma.clubMember.count({ where: { clubId: c.id } }),
      activeEventsCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch club:', err.message);
    res.status(500).json({ error: 'Failed to fetch club.' });
  }
};

// Create or Update a Club
const saveClub = async (req, res) => {
  try {
    const { name, description, department, departmentId, hodId, facultyInchargeId } = req.body;
    const targetId = req.params.id || req.body.id;

    if (!name || !name.trim() || !department) {
      return res.status(400).json({ error: 'Club name and department are required.' });
    }

    const [departmentRecord, hod, faculty] = await Promise.all([
      departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : prisma.department.findFirst({ where: { name: { equals: department.trim(), mode: 'insensitive' } } }),
      hodId ? prisma.user.findFirst({ where: { id: hodId, role: 'HOD' } }) : Promise.resolve(null),
      facultyInchargeId ? prisma.user.findFirst({ where: { id: facultyInchargeId, role: 'FACULTY_INCHARGE' } }) : Promise.resolve(null),
    ]);
    if (departmentId && !departmentRecord) return res.status(400).json({ error: 'Selected department was not found.' });
    if (hodId && !hod) return res.status(400).json({ error: 'Selected HOD account was not found.' });
    if (facultyInchargeId && !faculty) return res.status(400).json({ error: 'Selected Faculty Incharge account was not found.' });
    const relationData = { departmentId: departmentRecord?.id || null, hodId: hod?.id || null, facultyInchargeId: faculty?.id || null };
    let club;
    if (targetId) {
      const existing = await prisma.club.findUnique({ where: { id: targetId } });
      if (!existing) {
        return res.status(404).json({ error: 'Club record not found.' });
      }
      club = await prisma.club.update({
        where: { id: targetId },
        data: {
          name: name.trim(),
          description: description ? description.trim() : 'College student club.',
          department: department.trim(),
          ...relationData,
        },
      });
    } else {
      const duplicate = await prisma.club.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' } },
      });
      if (duplicate) {
        return res.status(400).json({ error: 'A club with this name already exists.' });
      }

      club = await prisma.club.create({
        data: {
          id: `club_${Date.now()}`,
          name: name.trim(),
          description: description ? description.trim() : 'College student club.',
          department: department.trim(),
          ...relationData,
        },
      });
    }

    res.status(targetId ? 200 : 201).json(club);
  } catch (err) {
    console.error('[SAVE_CLUB] Error:', err);
    res.status(500).json({ error: 'Failed to save club.' });
  }
};

// Delete a club (DSW only)
const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Forbidden: Only DSW can delete clubs.' });
    }

    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    // 1. Get all events belonging to this club
    const clubEvents = await prisma.event.findMany({
      where: { clubId: id },
      select: { id: true },
    });
    const eventIds = clubEvents.map((e) => e.id);

    // 2. Perform safe transactional deletion of dependent records
    await prisma.$transaction(async (tx) => {
      await tx.clubCoordinator.deleteMany({ where: { clubId: id } });
      await tx.clubMember.deleteMany({ where: { clubId: id } });

      if (eventIds.length > 0) {
        await tx.eventApproval.deleteMany({ where: { eventId: { in: eventIds } } });
        await tx.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
        await tx.attendance.deleteMany({ where: { eventId: { in: eventIds } } });
        await tx.document.deleteMany({ where: { eventId: { in: eventIds } } });
        await tx.event.deleteMany({ where: { clubId: id } });
      }

      await tx.club.delete({ where: { id } });
    });

    res.json({ message: 'Club deleted successfully.', club });
  } catch (err) {
    console.error('[DELETE_CLUB] Error:', err);
    res.status(500).json({ error: 'Failed to delete club.' });
  }
};

// Join a club (Student)
const joinClub = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can join clubs' });
    }

    // Check if the club exists
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Use upsert to safely handle duplicate joins
    const membership = await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId: id, userId } },
      update: {},
      create: { clubId: id, userId },
    });
    res.status(201).json(membership);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You are already a member of this club' });
    }
    console.error('[JOIN_CLUB] Error:', err);
    res.status(500).json({ error: 'Failed to join club.' });
  }
};

// Appoint a coordinator (Faculty)
const appointCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return res.status(404).json({ error: 'Club not found' });

    if (req.user.role !== 'FACULTY_INCHARGE' && req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Not authorized to manage this club' });
    }
    if (req.user.role === 'FACULTY_INCHARGE' && club.facultyInchargeId !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage coordinators for clubs assigned to you.' });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const coord = await prisma.clubCoordinator.upsert({
      where: { clubId_userId: { clubId: id, userId: studentId } },
      update: { facultyId: req.user.id, status: 'ACTIVE' },
      create: { clubId: id, userId: studentId, facultyId: req.user.id, status: 'ACTIVE' }
    });
    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId: id, userId: studentId } },
      update: {},
      create: { clubId: id, userId: studentId },
    });
    res.status(201).json(coord);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Student is already a coordinator' });
    }
    res.status(500).json({ error: 'Failed to appoint coordinator.' });
  }
};

const removeCoordinator = async (req, res) => {
  try {
    const { id: clubId, studentId } = req.params;
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ error: 'Club not found.' });
    if (req.user.role !== 'DSW' && !(req.user.role === 'FACULTY_INCHARGE' && club.facultyInchargeId === req.user.id)) return res.status(403).json({ error: 'Not authorized to manage this club.' });
    const assignment = await prisma.clubCoordinator.findUnique({ where: { clubId_userId: { clubId, userId: studentId } } });
    if (!assignment || assignment.status !== 'ACTIVE') return res.status(404).json({ error: 'Active coordinator assignment not found.' });
    await prisma.clubCoordinator.update({ where: { id: assignment.id }, data: { status: 'INACTIVE' } });
    res.json({ message: 'Coordinator removed successfully.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coordinator assignment not found.' });
    res.status(500).json({ error: 'Failed to remove coordinator.' });
  }
};

module.exports = { getClubs, getClubById, saveClub, deleteClub, joinClub, appointCoordinator, removeCoordinator };
