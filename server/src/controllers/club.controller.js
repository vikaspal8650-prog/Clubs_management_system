const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all clubs
const getClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        facultyIncharge: { select: { id: true, name: true, email: true } },
        coordinators: { include: { user: { select: { id: true, name: true, email: true } } } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });

    const formatted = clubs.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      department: c.department,
      category: 'Technical',
      facultyInchargeId: c.facultyInchargeId,
      facultyInchargeName: c.facultyIncharge ? c.facultyIncharge.name : 'Unassigned',
      coordinators: c.coordinators.map(coord => ({
        id: coord.user.id,
        name: coord.user.name,
        email: coord.user.email
      })),
      members: c.members.map(m => m.user),
      memberCount: c.members.length,
      activeEventsCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clubs', details: err.message });
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
        coordinators: { include: { user: { select: { id: true, name: true, email: true } } } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
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
      coordinators: c.coordinators.map(coord => ({
        id: coord.user.id,
        name: coord.user.name,
        email: coord.user.email
      })),
      members: c.members.map(m => m.user),
      memberCount: c.members.length,
      activeEventsCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch club', details: err.message });
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
    res.status(500).json({ error: 'Failed to save club', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete club', details: err.message });
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

    const membership = await prisma.clubMember.create({
      data: { clubId: id, userId }
    });
    res.status(201).json(membership);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You are already a member of this club' });
    }
    res.status(500).json({ error: 'Failed to join club', details: err.message });
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

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const coord = await prisma.clubCoordinator.create({
      data: { clubId: id, userId: studentId }
    });
    res.status(201).json(coord);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Student is already a coordinator' });
    }
    res.status(500).json({ error: 'Failed to appoint coordinator', details: err.message });
  }
};

const removeCoordinator = async (req, res) => {
  try {
    const { id: clubId, studentId } = req.params;
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ error: 'Club not found.' });
    if (req.user.role !== 'DSW' && !(req.user.role === 'FACULTY_INCHARGE' && club.facultyInchargeId === req.user.id)) return res.status(403).json({ error: 'Not authorized to manage this club.' });
    await prisma.clubCoordinator.delete({ where: { clubId_userId: { clubId, userId: studentId } } });
    res.json({ message: 'Coordinator removed successfully.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coordinator assignment not found.' });
    res.status(500).json({ error: 'Failed to remove coordinator', details: err.message });
  }
};

module.exports = { getClubs, getClubById, saveClub, deleteClub, joinClub, appointCoordinator, removeCoordinator };
