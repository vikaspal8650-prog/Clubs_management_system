const { randomUUID } = require('crypto');
const { prisma } = require('../db');

const STATUS = {
  PENDING_FACULTY: 'PENDING_FACULTY_APPROVAL',
  PENDING_HOD: 'PENDING_HOD_APPROVAL',
  PENDING_DSW: 'PENDING_DSW_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const listCertificates = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      where.OR = [{ studentId: req.user.id }, { submittedById: req.user.id }];
    } else if (req.user.role === 'FACULTY_INCHARGE') {
      where.club = { facultyInchargeId: req.user.id };
    } else if (req.user.role === 'HOD') {
      const account = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      where.department = account?.department || '__none__';
    } else if (req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Not authorized to view certificates.' });
    }
    const rows = await prisma.certificateRecord.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows.map((row) => row.payload));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
};

const createBatch = async (req, res) => {
  try {
    const { eventId, clubId, studentEntries } = req.body;
    if (!Array.isArray(studentEntries) || studentEntries.length !== 3) return res.status(400).json({ error: 'Exactly 3 student certificate entries are required.' });
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { club: true } });
    if (!event || event.clubId !== clubId) return res.status(404).json({ error: 'Event or club not found.' });
    const coordinator = await prisma.clubCoordinator.findFirst({ where: { clubId, userId: req.user.id, status: 'ACTIVE' } });
    if (!coordinator) return res.status(403).json({ error: 'Only an active club coordinator can submit certificate results.' });
    const positions = new Set(['1st Prize', '2nd Prize', '3rd Prize']);
    if (new Set(studentEntries.map((entry) => entry.position)).size !== 3 || studentEntries.some((entry) => !positions.has(entry.position))) {
      return res.status(400).json({ error: 'Each prize position must be assigned exactly once.' });
    }
    const studentIds = studentEntries.map((entry) => entry.studentId);
    if (new Set(studentIds).size !== 3) return res.status(400).json({ error: 'Each certificate must belong to a different student.' });
    const students = await prisma.user.findMany({ where: { id: { in: studentIds }, role: 'STUDENT' }, select: { id: true, name: true, email: true } });
    if (students.length !== 3) return res.status(400).json({ error: 'One or more selected student accounts were not found.' });
    const attendanceCount = await prisma.attendance.count({ where: { eventId, userId: { in: studentIds }, status: 'PRESENT' } });
    if (attendanceCount !== 3) return res.status(400).json({ error: 'Certificates can only be submitted for students marked present at the event.' });
    const submitter = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true } });
    const batchId = randomUUID();
    const date = event.date.toISOString().split('T')[0];
    const entries = studentEntries.map((entry) => {
      const student = students.find((record) => record.id === entry.studentId);
      return {
        id: randomUUID(), batchId, studentId: student.id, studentName: student.name, studentEmail: student.email,
        eventId: event.id, eventName: event.title, clubId: event.club.id, clubName: event.club.name,
        department: event.club.department, position: entry.position, eventDate: date,
        status: STATUS.PENDING_FACULTY, submittedBy: submitter, submittedAt: new Date().toISOString(),
        coordinatorSignature: { name: submitter.name, title: 'Student Coordinator', signedAt: new Date().toISOString() },
        facultyApproval: null, hodApproval: null, dswApproval: null, rejectionReason: null,
      };
    });
    const duplicate = await prisma.certificateRecord.findFirst({ where: { eventId, studentId: { in: studentIds }, status: { not: STATUS.REJECTED } } });
    if (duplicate) return res.status(409).json({ error: 'A certificate for one of these students and this event already exists.' });
    await prisma.$transaction(entries.map((payload) => prisma.certificateRecord.create({ data: {
      id: payload.id, batchId, studentId: payload.studentId, submittedById: req.user.id, eventId,
      clubId, department: event.club.department, position: payload.position, status: payload.status, payload,
    } })));
    res.status(201).json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save certificate batch.' });
  }
};

const updateCertificate = async (req, res) => {
  try {
    const row = await prisma.certificateRecord.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: 'Certificate record not found.' });
    const cert = row.payload;
    const actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, role: true, department: true } });
    if (req.body.action === 'RESUBMIT') {
      if (actor.role !== 'STUDENT' || row.submittedById !== actor.id || cert.status !== STATUS.REJECTED) return res.status(403).json({ error: 'Not authorized to resubmit this certificate.' });
      const payload = { ...cert, status: STATUS.PENDING_FACULTY, rejectionReason: null, rejectedAtStage: null, facultyApproval: null, hodApproval: null, dswApproval: null, submittedAt: new Date().toISOString() };
      await prisma.certificateRecord.update({ where: { id: row.id }, data: { status: payload.status, payload } });
      return res.json(payload);
    }
    const isFaculty = actor.role === 'FACULTY_INCHARGE' && row.clubId && await prisma.club.findFirst({ where: { id: row.clubId, facultyInchargeId: actor.id } });
    const isHod = actor.role === 'HOD' && actor.department && actor.department === row.department;
    if (!(actor.role === 'DSW' || isFaculty || isHod)) return res.status(403).json({ error: 'Not authorized to review this certificate.' });
    const now = new Date().toISOString();
    const isReject = req.body.action === 'REJECT';
    const expected = actor.role === 'FACULTY_INCHARGE' ? STATUS.PENDING_FACULTY : actor.role === 'HOD' ? STATUS.PENDING_HOD : STATUS.PENDING_DSW;
    if (cert.status !== expected) return res.status(409).json({ error: 'Certificate is not awaiting your review.' });
    let payload;
    if (isReject) {
      const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
      if (!reason) return res.status(400).json({ error: 'A rejection reason is required.' });
      payload = { ...cert, status: STATUS.REJECTED, rejectionReason: reason, rejectedAtStage: actor.role, rejectedBy: { id: actor.id, name: actor.name, role: actor.role, rejectedAt: now } };
    } else if (req.body.action === 'APPROVE') {
      const stage = actor.role === 'FACULTY_INCHARGE' ? 'facultyApproval' : actor.role === 'HOD' ? 'hodApproval' : 'dswApproval';
      const next = actor.role === 'FACULTY_INCHARGE' ? STATUS.PENDING_HOD : actor.role === 'HOD' ? STATUS.PENDING_DSW : STATUS.APPROVED;
      const title = actor.role === 'FACULTY_INCHARGE' ? 'Faculty Incharge' : actor.role === 'HOD' ? 'Head of Department' : 'Dean Student Welfare';
      payload = { ...cert, status: next, rejectionReason: null, [stage]: { approvedBy: actor.name, approvedById: actor.id, title, signedAt: now, status: 'APPROVED' } };
    } else return res.status(400).json({ error: 'Action must be APPROVE or REJECT.' });
    const changed = await prisma.certificateRecord.updateMany({ where: { id: row.id, status: row.status }, data: { status: payload.status, payload } });
    if (changed.count !== 1) return res.status(409).json({ error: 'Certificate review was already processed.' });
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update certificate.' });
  }
};

module.exports = { listCertificates, createBatch, updateCertificate };
