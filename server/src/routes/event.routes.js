const express = require('express');
const { getEvents, createEvent, processEventApproval, registerForEvent, markAttendance, getAttendance, createAttendanceSession, getAttendanceSession, markAttendanceFromSession } = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(process.cwd(), 'uploads'), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, PNG, and JPG files are allowed')) });

const router = express.Router();

router.get('/', authenticate, getEvents);
router.post('/attendance/sessions', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), createAttendanceSession);
router.get('/attendance/sessions/:token', getAttendanceSession);
router.post('/attendance/sessions/:token/check-in', authenticate, authorize(['STUDENT']), markAttendanceFromSession);
router.post('/', authenticate, authorize(['STUDENT']), upload.single('supportingDocument'), createEvent);
router.post('/:id/approve', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), processEventApproval);
router.post('/:id/approval', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), processEventApproval);
router.post('/:id/register', authenticate, authorize(['STUDENT']), registerForEvent);
router.post('/:id/attendance', authenticate, authorize(['FACULTY_INCHARGE', 'HOD', 'DSW']), markAttendance);
router.get('/me/attendance', authenticate, getAttendance);

module.exports = router;
