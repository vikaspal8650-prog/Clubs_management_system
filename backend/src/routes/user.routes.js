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

router.get('/', authenticate, authorize(['DSW']), getAllUsers);
router.get('/staff', authenticate, authorize(['DSW', 'HOD', 'FACULTY_INCHARGE']), getStaffAccounts);
router.get('/stats', authenticate, authorize(['DSW']), getUserStats);
router.post('/hod', authenticate, authorize(['DSW']), createHod);
router.post('/faculty', authenticate, authorize(['DSW']), createFaculty);
router.get('/department-students', authenticate, authorize(['HOD', 'FACULTY_INCHARGE', 'DSW']), getDepartmentStudents);
router.delete('/students/:id', authenticate, authorize(['FACULTY_INCHARGE', 'DSW']), deleteStudent);
router.put('/profile', authenticate, updateStudentProfile);
router.delete('/:id', authenticate, authorize(['DSW']), deleteUser);

module.exports = router;
