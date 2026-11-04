const express = require('express');
const router = express.Router();
const { getClubs, getClubById, saveClub, deleteClub, joinClub, appointCoordinator, removeCoordinator } = require('../controllers/club.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, getClubs);
router.get('/:id', authenticate, getClubById);
router.post('/', authenticate, authorize(['DSW']), saveClub);
router.put('/:id', authenticate, authorize(['DSW']), saveClub);
router.delete('/:id', authenticate, authorize(['DSW']), deleteClub);
router.post('/:id/join', authenticate, joinClub);
router.post('/:id/appoint-coordinator', authenticate, appointCoordinator);
router.delete('/:id/coordinators/:studentId', authenticate, removeCoordinator);

module.exports = router;
