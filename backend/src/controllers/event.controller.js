const { prisma } = require('../db');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const createAttendanceSession = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { club: true } });
    if (!event || event.status !== 'APPROVED') return res.status(404).json({ error: 'Approved event not found.' });
    if (req.user.role === 'FACULTY_INCHARGE' && event.club.facultyInchargeId !== req.user.id) return res.status(403).json({ error: 'You are not assigned to this event.' });
    if (req.user.role === 'HOD') {
      const hod = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      if (!hod?.department || hod.department !== event.club.department) return res.status(403).json({ error: 'You are not assigned to this department.' });
    }
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const token = jwt.sign({ sessionId, eventId: event.id, clubId: event.clubId, purpose: 'attendance' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    await prisma.$transaction(async (tx) => {
      await tx.attendanceSession.updateMany({ where: { eventId: event.id, closedAt: null }, data: { closedAt: new Date() } });
      await tx.attendanceSession.create({ data: { id: sessionId, eventId: event.id, clubId: event.clubId, createdById: req.user.id, expiresAt, qrToken: token } });
    });
    res.status(201).json({ id: token, sessionId, eventId: event.id, expiresAt: expiresAt.toISOString(), event: { id: event.id, title: event.title }, club: { id: event.club.id, name: event.club.name } });
  } catch (err) {
    console.error('Failed to create attendance session:', {
      eventId: req.body?.eventId || null,
      userId: req.user?.id || null,
      code: err.code || 'UNKNOWN',
      name: err.name || 'Error',
      message: err.message || 'No error message provided',
    });
    if (['P2021', 'P2022'].includes(err.code)) {
      return res.status(503).json({ code: 'ATTENDANCE_STORAGE_NOT_READY', error: 'Attendance storage is not ready. Apply the pending Prisma migration, then retry.' });
    }
    if (['P1000', 'P1001', 'P1002', 'P1017'].includes(err.code)) {
      return res.status(503).json({ code: 'ATTENDANCE_DATABASE_UNAVAILABLE', error: 'The attendance database is temporarily unavailable. Please retry shortly.' });
    }
    res.status(500).json({ error: 'Failed to create attendance session.' });
  }
};

const getStudentAttendanceSessions = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'APPROVED',
        registrations: { some: { userId: req.user.id } },
        club: { members: { some: { userId: req.user.id } } },
      },
      select: {
        id: true,
        title: true,
        date: true,
        clubId: true,
        club: { select: { id: true, name: true } },
        attendanceSessions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const now = new Date();
    res.json(events.map((event) => {
      const session = event.attendanceSessions[0];
      const active = session && !session.closedAt && session.expiresAt > now;
      return { event: { id: event.id, title: event.title, date: event.date }, club: event.club, status: active ? 'AVAILABLE' : session ? 'CLOSED' : 'NOT_STARTED', ...(active ? { id: session.qrToken, expiresAt: session.expiresAt.toISOString() } : {}) };
    }));
  } catch (err) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Failed to fetch attendance sessions for student ${req.user.id}:`, {
      code: err.code || 'UNKNOWN',
      name: err.name || 'Error',
      message: err.message || 'No error message provided',
    });
    if (['P2021', 'P2022'].includes(err.code)) {
      return res.status(503).json({
        code: 'ATTENDANCE_STORAGE_NOT_READY',
        error: 'Attendance storage is not ready. Apply the pending Prisma migration, then retry.',
        requestId,
      });
    }
    if (['P1000', 'P1001', 'P1002', 'P1017'].includes(err.code)) {
      return res.status(503).json({
        code: 'ATTENDANCE_DATABASE_UNAVAILABLE',
        error: 'The attendance database is temporarily unavailable. Please retry shortly.',
        requestId,
      });
    }
    res.status(500).json({
      code: 'ATTENDANCE_SESSIONS_FETCH_FAILED',
      error: 'Attendance sessions could not be loaded. Share the reference ID with support.',
      requestId,
    });
  }
};

const getAttendanceSession = async (req, res) => {
  try {
    const claims = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (claims.purpose !== 'attendance') return res.status(400).json({ error: 'Invalid attendance session.' });
    const storedSession = await prisma.attendanceSession.findUnique({ where: { id: claims.sessionId } });
    if (!storedSession || storedSession.qrToken !== req.params.token || storedSession.eventId !== claims.eventId || storedSession.clubId !== claims.clubId || storedSession.closedAt || storedSession.expiresAt <= new Date()) return res.status(401).json({ error: 'Attendance session is closed or expired.' });
    const event = await prisma.event.findUnique({ where: { id: claims.eventId }, include: { club: { select: { id: true, name: true, facultyInchargeId: true, department: true } } } });
    if (!event || event.status !== 'APPROVED' || event.club.id !== claims.clubId || storedSession.clubId !== event.clubId) return res.status(404).json({ error: 'Approved event not found.' });
    if (req.user.role === 'FACULTY_INCHARGE') {
      if (event.club.facultyInchargeId !== req.user.id) return res.status(403).json({ error: 'You are not assigned to this event.' });
    } else if (req.user.role === 'HOD') {
      const hod = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      if (!hod?.department || hod.department !== event.club.department) return res.status(403).json({ error: 'You are not assigned to this department.' });
    } else if (req.user.role === 'STUDENT') {
      const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: req.user.id } } });
      if (!registration) return res.status(403).json({ error: 'Register for the event before viewing its attendance QR.' });
      const membership = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: claims.clubId, userId: req.user.id } } });
      if (!membership) return res.status(403).json({ error: 'Join this event club before viewing its attendance QR.' });
    }
    res.json({ id: req.params.token, event: { id: event.id, title: event.title }, club: { id: event.club.id, name: event.club.name }, expiresAt: new Date(claims.exp * 1000).toISOString() });
  } catch (err) {
    res.status(401).json({ error: 'Attendance session is invalid or expired.' });
  }
};

const markAttendanceFromSession = async (req, res) => {
  try {
    const claims = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (claims.purpose !== 'attendance') return res.status(400).json({ error: 'Invalid attendance session.' });
    const storedSession = await prisma.attendanceSession.findUnique({ where: { id: claims.sessionId } });
    if (!storedSession || storedSession.qrToken !== req.params.token || storedSession.eventId !== claims.eventId || storedSession.clubId !== claims.clubId || storedSession.closedAt || storedSession.expiresAt <= new Date()) return res.status(401).json({ error: 'Attendance session is closed or expired.' });
    const student = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, role: true } });
    if (student?.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can record attendance.' });
    const event = await prisma.event.findUnique({ where: { id: claims.eventId }, select: { id: true, clubId: true, status: true } });
    if (!event || event.status !== 'APPROVED') return res.status(404).json({ error: 'Approved event not found.' });
    const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: claims.eventId, userId: student.id } } });
    if (!registration) return res.status(403).json({ error: 'Register for the event before checking in.' });
    const membership = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: event.clubId, userId: student.id } } });
    if (!membership || event.clubId !== claims.clubId) return res.status(403).json({ error: 'Join this event club before checking in.' });
    const attendance = await prisma.attendance.create({ data: { eventId: claims.eventId, userId: student.id, status: 'PRESENT' } });
    res.status(201).json({ record: attendance });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Attendance has already been recorded for this event.' });
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Attendance session is invalid or expired.' });
    res.status(500).json({ error: 'Failed to record attendance.' });
  }
};

/**
 * Map a raw Prisma event to the shape the frontend expects.
 * Frontend uses: startDate, clubName, department, registrationDeadline, submittedById, submittedAt
 */
const formatEvent = (event, registeredIds = null) => {
  const base = {
    ...event,
    // Alias 'date' → 'startDate' so the frontend date columns render correctly
    startDate: event.date,
    // Flatten club name and department for easy table access
    clubName: event.club ? event.club.name : '',
    department: event.club ? event.club.department : '',
    // registrationDeadline: use the event date as a sensible fallback if not stored separately
    registrationDeadline: event.registrationDeadline || event.date,
    // Map coordinatorId → submittedById so coordinator proposal tracking works
    submittedById: event.coordinatorId || null,
    // Use createdAt as submittedAt
    submittedAt: event.createdAt,
  };
  if (registeredIds !== null) {
    base.registered = registeredIds.has(event.id);
  }
  return base;
};

// Get all events (can be filtered by club, status)
const getEvents = async (req, res) => {
  try {
    const { clubId, status } = req.query;
    const where = {};
    if (clubId) where.clubId = clubId;
    if (status) where.status = status;
    if (req.user.role === 'STUDENT') {
      where.OR = [
        { status: 'APPROVED' },
        { coordinatorId: req.user.id },
        { registrations: { some: { userId: req.user.id } } },
        { club: { coordinators: { some: { userId: req.user.id, status: 'ACTIVE' } } } },
      ];
    } else if (req.user.role === 'FACULTY_INCHARGE') {
      where.club = { facultyInchargeId: req.user.id };
    } else if (req.user.role === 'HOD') {
      const hod = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      where.club = { department: hod?.department || '__none__' };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        club: { select: { id: true, name: true, department: true } },
        documents: req.user.role === 'STUDENT' ? { where: { category: { not: 'Event Proposal' } } } : true,
        ...(req.user.role === 'STUDENT' ? {} : { approvals: true }),
        _count: { select: { registrations: true, attendances: true } }
      }
    });

    if (req.user.role === 'STUDENT') {
      const registrations = await prisma.eventRegistration.findMany({ where: { userId: req.user.id }, select: { eventId: true } });
      const registeredIds = new Set(registrations.map((registration) => registration.eventId));
      return res.json(events.map((event) => formatEvent(event, registeredIds)));
    }

    res.json(events.map((event) => formatEvent(event)));
  } catch (err) {
    console.error('Failed to fetch events:', err.message);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

// Create an event proposal (Student Coordinator)
const createEvent = async (req, res) => {
  try {
    const { title, description, objective, additionalDetails, date, startTime, endTime, venue, capacity, clubId } = req.body;
    if (!title || !description || !date || !startTime || !endTime || !venue || !capacity || !clubId) {
      return res.status(400).json({ error: 'All event fields are required' });
    }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) return res.status(400).json({ error: 'Capacity must be a positive whole number' });
    const eventDate = new Date(date);
    if (Number.isNaN(eventDate.getTime())) return res.status(400).json({ error: 'Enter a valid event date.' });
    
    // Verify user is coordinator
    const isCoordinator = await prisma.clubCoordinator.findFirst({
      where: { clubId, userId: req.user.id }
    });
    if (!isCoordinator) return res.status(403).json({ error: 'Only club coordinators can propose events' });

    const event = await prisma.event.create({
      data: {
        title, description, date: eventDate, startTime, endTime, venue, capacity: Number(capacity),
        status: 'PENDING_FACULTY',
        clubId, objective: objective || null, additionalDetails: additionalDetails || null, coordinatorId: req.user.id,
      }
    });
    if (req.file) await prisma.document.create({ data: { title: path.basename(req.file.originalname).slice(0, 200), category: 'Event Proposal', fileUrl: `/uploads/${req.file.filename}`, eventId: event.id } });
    const faculty = await prisma.club.findUnique({ where: { id: clubId }, select: { facultyInchargeId: true } });
    if (faculty?.facultyInchargeId) await prisma.notification.create({ data: { userId: faculty.facultyInchargeId, message: `New event proposal: ${event.title}` } });
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'Student proposed event', details: event.title } });
    const eventWithDocuments = await prisma.event.findUnique({
      where: { id: event.id },
      include: { documents: true, club: { select: { id: true, name: true, department: true } } },
    });
    res.status(201).json(formatEvent(eventWithDocuments));
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    console.error('Failed to create event:', err.message);
    res.status(500).json({ error: 'Failed to create event.' });
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

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const changed = await tx.event.updateMany({ where: { id, status: event.status }, data: {
        status: nextStatus,
        rejectionReason: action === 'REJECT' ? reason : null,
        facultyDecision: role === 'FACULTY_INCHARGE' ? action : undefined,
        facultyDecisionAt: role === 'FACULTY_INCHARGE' ? new Date() : undefined,
        hodDecision: role === 'HOD' ? action : undefined,
        hodDecisionAt: role === 'HOD' ? new Date() : undefined,
        officiallyDeclared: role === 'HOD' && action === 'APPROVE',
      } });
      if (changed.count !== 1) throw Object.assign(new Error('Event approval was already processed.'), { code: 'STALE_EVENT' });
      await tx.eventApproval.create({ data: { eventId: id, userId: req.user.id, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reason: reason || null, role } });
      return tx.event.findUnique({ where: { id }, include: { club: { select: { id: true, name: true, department: true } } } });
    });

    const recipients = [event.coordinatorId, role === 'FACULTY_INCHARGE' ? null : event.club.facultyInchargeId].filter(Boolean);
    await Promise.all(recipients.map((userId) => prisma.notification.create({ data: { userId, message: `${event.title}: ${role} ${action.toLowerCase()}d the proposal${reason ? ` — ${reason}` : ''}.` } })));
    await prisma.activityLog.create({ data: { userId: req.user.id, action: `${role} ${action.toLowerCase()}d event`, details: event.title } });

    res.json({ ...formatEvent(updatedEvent), documents: event.documents });
  } catch (err) {
    if (err.code === 'STALE_EVENT') return res.status(409).json({ error: err.message });
    res.status(500).json({ error: 'Failed to process approval.' });
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
    console.error('Failed to register for event:', err.message);
    res.status(500).json({ error: 'Failed to register for event.' });
  }
};

const markAttendance = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event || event.status !== 'APPROVED') return res.status(404).json({ error: 'Approved event not found' });
    return res.status(403).json({ error: 'Attendance must be recorded by an authorized event staff member.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

const getAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      const { eventId } = req.query;
      const eventScope = req.user.role === 'FACULTY_INCHARGE'
        ? { club: { facultyInchargeId: req.user.id } }
        : req.user.role === 'HOD'
          ? { club: { department: (await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } }))?.department || '__none__' } }
          : {};
      const where = { event: eventScope };
      if (eventId) where.eventId = eventId;
      const records = await prisma.attendance.findMany({ where, include: { user: { select: { id: true, name: true, rollNumber: true, department: true, branch: true } }, event: { include: { club: { select: { id: true, name: true } } } } }, orderBy: { markedAt: 'desc' } });
      return res.json(records);
    }
    const attendance = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      include: { event: { include: { club: { select: { id: true, name: true } } } } },
      orderBy: { markedAt: 'desc' },
    });
    res.json(attendance);
  } catch (err) {
    console.error('Failed to fetch attendance:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
};

// Return only students recorded present for an event. Certificate entry is
// limited to an active coordinator of the event's club.
const getCertificateEligibleStudents = async (req, res) => {
  try {
    const { eventId } = req.params;
    const coordinator = await prisma.clubCoordinator.findFirst({
      where: { userId: req.user.id, status: 'ACTIVE', club: { events: { some: { id: eventId } } } },
      select: { id: true },
    });
    if (!coordinator) return res.status(403).json({ error: 'Only an active coordinator of this event club can view eligible students.' });
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const attendance = await prisma.attendance.findMany({
      where: { eventId, status: 'PRESENT', user: { role: 'STUDENT', status: 'ACTIVE' } },
      select: { user: { select: { id: true, name: true, email: true, department: true, branch: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    res.json(attendance.map(({ user }) => ({ ...user, attendanceEventIds: [eventId] })));
  } catch (err) {
    console.error('Failed to fetch certificate eligible students:', err.message);
    res.status(500).json({ error: 'Failed to fetch eligible students.' });
  }
};

module.exports = { getEvents, createEvent, processEventApproval, registerForEvent, markAttendance, getAttendance, getCertificateEligibleStudents, createAttendanceSession, getStudentAttendanceSessions, getAttendanceSession, markAttendanceFromSession };
