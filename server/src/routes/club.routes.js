const express = require('express');
const router = express.Router();
const { getClubs, getClubById, saveClub, deleteClub, joinClub, appointCoordinator, removeCoordinator } = require('../controllers/club.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', getClubs);
router.get('/:id', getClubById);
router.post('/', authenticate, authorize(['DSW', 'FACULTY_INCHARGE']), saveClub);
router.put('/:id', authenticate, authorize(['DSW', 'FACULTY_INCHARGE']), saveClub);
router.delete('/:id', authenticate, authorize(['DSW']), deleteClub);
router.post('/:id/join', authenticate, joinClub);
router.post('/:id/appoint-coordinator', authenticate, appointCoordinator);
router.delete('/:id/coordinators/:studentId', authenticate, removeCoordinator);

module.exports = router;
