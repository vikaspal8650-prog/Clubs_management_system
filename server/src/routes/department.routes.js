const express = require('express');
const { getDepartments, saveDepartment, deleteDepartment } = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.get('/', getDepartments);
router.post('/', authenticate, authorize(['DSW']), saveDepartment);
router.put('/:id', authenticate, authorize(['DSW']), saveDepartment);
router.delete('/:id', authenticate, authorize(['DSW']), deleteDepartment);
module.exports = router;
