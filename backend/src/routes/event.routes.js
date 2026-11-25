const express = require('express');
const { getEvents, createEvent, processEventApproval, registerForEvent, markAttendance, getAttendance, getCertificateEligibleStudents, createAttendanceSession, getStudentAttendanceSessions, getAttendanceSession, markAttendanceFromSession } = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
require('dotenv').config();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const uploadDir = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'uniclubs-uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, PNG, and JPG files are allowed')) });

const router = express.Router();

router.get('/', authenticate, getEvents);
router.post('/attendance/sessions', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), createAttendanceSession);
router.get('/attendance/sessions', authenticate, authorize(['STUDENT']), getStudentAttendanceSessions);
router.get('/attendance/sessions/:token', authenticate, authorize(['STUDENT', 'FACULTY_INCHARGE', 'HOD', 'DSW']), getAttendanceSession);
router.post('/attendance/sessions/:token/check-in', authenticate, authorize(['STUDENT']), markAttendanceFromSession);
router.post('/', authenticate, authorize(['STUDENT']), upload.single('supportingDocument'), createEvent);
router.post('/:id/approve', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), processEventApproval);
router.post('/:id/approval', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), processEventApproval);
router.post('/:id/register', authenticate, authorize(['STUDENT']), registerForEvent);
router.post('/:id/attendance', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), markAttendance);
router.get('/me/attendance', authenticate, getAttendance);
router.get('/:eventId/certificate-eligible-students', authenticate, authorize(['STUDENT']), getCertificateEligibleStudents);

module.exports = router;
