const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all events (can be filtered by club, status)
const getEvents = async (req, res) => {
  try {
    const { clubId, status } = req.query;
    const where = {};
    if (clubId) where.clubId = clubId;
    if (status) where.status = status;

    const events = await prisma.event.findMany({
      where,
      include: {
        club: { select: { id: true, name: true, department: true } },
        documents: true,
        approvals: true,
        _count: { select: { registrations: true, attendances: true } }
      }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
};

// Create an event proposal (Student Coordinator)
const createEvent = async (req, res) => {
  try {
    const { title, description, objective, additionalDetails, date, startTime, endTime, venue, capacity, clubId } = req.body;
    if (!title || !description || !date || !startTime || !endTime || !venue || !capacity || !clubId) {
      return res.status(400).json({ error: 'All event fields are required' });
    }
    if (Number(capacity) < 1 || Number.isNaN(Number(capacity))) return res.status(400).json({ error: 'Capacity must be a positive number' });
    
    // Verify user is coordinator
    const isCoordinator = await prisma.clubCoordinator.findFirst({
      where: { clubId, userId: req.user.id }
    });
    if (!isCoordinator) return res.status(403).json({ error: 'Only club coordinators can propose events' });

    const event = await prisma.event.create({
      data: {
        title, description, date: new Date(date), startTime, endTime, venue, capacity: parseInt(capacity),
        status: 'PENDING_FACULTY',
        clubId, objective: objective || null, additionalDetails: additionalDetails || null, coordinatorId: req.user.id,
      }
    });
    if (req.file) await prisma.document.create({ data: { title: req.file.originalname, category: 'Event Proposal', fileUrl: `/uploads/${req.file.filename}`, eventId: event.id } });
    const faculty = await prisma.club.findUnique({ where: { id: clubId }, select: { facultyInchargeId: true } });
    if (faculty?.facultyInchargeId) await prisma.notification.create({ data: { userId: faculty.facultyInchargeId, message: `New event proposal: ${event.title}` } });
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'Student proposed event', details: event.title } });
    const eventWithDocuments = await prisma.event.findUnique({
      where: { id: event.id },
      include: { documents: true },
    });
    res.status(201).json(eventWithDocuments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event', details: err.message });
  }
};

// Approve/Reject event
const processEventApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'
    const role = req.user.role;
    if (!['APPROVE', 'REJECT'].includes(action)) return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });

    const event = await prisma.event.findUnique({ where: { id }, include: { club: true, documents: true } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    let nextStatus = event.status;

    if (role === 'FACULTY_INCHARGE') {
      if (event.club.facultyInchargeId !== req.user.id) return res.status(403).json({ error: 'Not authorized for this club' });
      if (event.status !== 'PENDING_FACULTY') return res.status(400).json({ error: 'Event not pending faculty approval' });
      nextStatus = action === 'APPROVE' ? 'PENDING_HOD' : 'REJECTED_BY_FACULTY';
    } 
    else if (role === 'HOD') {
      if (event.status !== 'PENDING_HOD') return res.status(400).json({ error: 'Event not pending HOD approval' });
      const hod = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      if (!hod || event.club.department !== hod.department) return res.status(403).json({ error: 'Not authorized for this department' });
      nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED_BY_HOD';
    }
    else if (role === 'DSW') {
      // DSW can override even approved events
      if (action !== 'REJECT') return res.status(400).json({ error: 'DSW can only override/reject' });
      nextStatus = 'OVERRIDDEN_BY_DSW';
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: nextStatus,
        rejectionReason: action === 'REJECT' ? reason : null,
        facultyDecision: role === 'FACULTY_INCHARGE' ? action : undefined,
        facultyDecisionAt: role === 'FACULTY_INCHARGE' ? new Date() : undefined,
        hodDecision: role === 'HOD' ? action : undefined,
        hodDecisionAt: role === 'HOD' ? new Date() : undefined,
        officiallyDeclared: role === 'HOD' && action === 'APPROVE',
      }
    });

    await prisma.eventApproval.create({
      data: {
        eventId: id,
        userId: req.user.id,
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reason: reason || null,
        role
      }
    });

    const recipients = [event.coordinatorId, role === 'FACULTY_INCHARGE' ? null : event.club.facultyInchargeId].filter(Boolean);
    await Promise.all(recipients.map((userId) => prisma.notification.create({ data: { userId, message: `${event.title}: ${role} ${action.toLowerCase()}d the proposal${reason ? ` — ${reason}` : ''}.` } })));
    await prisma.activityLog.create({ data: { userId: req.user.id, action: `${role} ${action.toLowerCase()}d event`, details: event.title } });

    res.json({ ...updatedEvent, documents: event.documents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process approval', details: err.message });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: { _count: { select: { registrations: true } } } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'APPROVED') return res.status(400).json({ error: 'Event is not open for registration' });
    if (event._count.registrations >= event.capacity) return res.status(400).json({ error: 'Event capacity has been reached' });
    const registration = await prisma.eventRegistration.create({ data: { eventId: event.id, userId: req.user.id } });
    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'You are already registered for this event' });
    res.status(500).json({ error: 'Failed to register for event', details: err.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event || event.status !== 'APPROVED') return res.status(404).json({ error: 'Approved event not found' });
    const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: req.user.id } } });
    if (!registration) return res.status(400).json({ error: 'Register for this event before marking attendance' });
    const attendance = await prisma.attendance.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user.id } },
      update: { status: 'PRESENT', markedAt: new Date() },
      create: { eventId: event.id, userId: req.user.id, status: 'PRESENT' },
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      include: { event: { include: { club: { select: { id: true, name: true } } } } },
      orderBy: { markedAt: 'desc' },
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
  }
};

module.exports = { getEvents, createEvent, processEventApproval, registerForEvent, markAttendance, getAttendance };
