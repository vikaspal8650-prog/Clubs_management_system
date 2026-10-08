const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getStaffAccounts,
  getUserStats,
  createHod,
  createFaculty,
  getDepartmentStudents,
  deleteStudent,
  updateStudentProfile,
  deleteUser,
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', authenticate, getAllUsers);
router.get('/staff', authenticate, authorize(['DSW']), getStaffAccounts);
router.get('/stats', authenticate, getUserStats);
router.post('/hod', authenticate, authorize(['DSW']), createHod);
router.post('/faculty', authenticate, authorize(['DSW']), createFaculty);
router.get('/department-students', authenticate, getDepartmentStudents);
router.delete('/students/:id', authenticate, deleteStudent);
router.put('/profile', authenticate, updateStudentProfile);
router.delete('/:id', authenticate, authorize(['DSW']), deleteUser);

module.exports = router;
