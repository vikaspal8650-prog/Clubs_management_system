const express = require('express');
const router = express.Router();
const { getEventParticipation, getClubMembership } = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/event-participation', authorize(['DSW', 'HOD', 'FACULTY_INCHARGE']), getEventParticipation);
router.get('/club-membership', authorize(['DSW']), getClubMembership);

module.exports = router;
