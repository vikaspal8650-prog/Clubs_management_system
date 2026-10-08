const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/users
 * Returns all registered users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        branch: true,
        year: true,
        semester: true,
        rollNumber: true,
        createdAt: true,
        clubsAsFaculty: { select: { id: true, name: true } },
        coordinatedClubs: { select: { clubId: true } },
        joinedClubs: { select: { clubId: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = users.map(u => ({
      ...u,
      clubIds: u.clubsAsFaculty.map(c => c.id),
      joinedClubs: u.joinedClubs.map(c => c.clubId),
      coordinatorOfClubs: u.coordinatedClubs.map(c => c.clubId),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
};

/**
 * GET /api/users/staff
 * Returns HOD and Faculty Incharge accounts
 */
const getStaffAccounts = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['HOD', 'FACULTY_INCHARGE'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
        clubsAsFaculty: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = staff.map(u => ({
      ...u,
      clubIds: u.clubsAsFaculty.map(c => c.id),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff accounts', details: err.message });
  }
};

/**
 * GET /api/users/stats
 * Dynamic user statistics for DSW
 */
const getUserStats = async (req, res) => {
  try {
    const [totalHods, totalFaculty, totalStudents, totalUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'HOD' } }),
      prisma.user.count({ where: { role: 'FACULTY_INCHARGE' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count(),
    ]);

    res.json({ totalHods, totalFaculty, totalStudents, totalUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats', details: err.message });
  }
};

/**
 * POST /api/users/hod
 * Create HOD account (DSW only)
 */
const createHod = async (req, res) => {
  try {
    if (req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Forbidden: Only DSW can create HOD accounts.' });
    }

    const { name, email, password, department } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'College Email is required.' });
    if (!department || !department.trim()) return res.status(400).json({ error: 'Department is required.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long.' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(400).json({ error: 'An account with this email address already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newHod = await prisma.user.create({
      data: {
        id: `usr_hod_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'HOD',
        department: department.trim(),
        status: 'ACTIVE',
      },
    });

    const safeObj = { ...newHod };
    delete safeObj.password;
    res.status(201).json(safeObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create HOD account', details: err.message });
  }
};

/**
 * POST /api/users/faculty
 * Create Faculty Incharge account (DSW only)
 */
const createFaculty = async (req, res) => {
  try {
    if (req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Forbidden: Only DSW can create Faculty accounts.' });
    }

    const { name, email, password, department, clubIds } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'College Email is required.' });
    if (!department || !department.trim()) return res.status(400).json({ error: 'Department is required.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long.' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(400).json({ error: 'An account with this email address already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newFaculty = await prisma.user.create({
      data: {
        id: `usr_faculty_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'FACULTY_INCHARGE',
        department: department.trim(),
        status: 'ACTIVE',
      },
    });

    const assignedClubs = Array.isArray(clubIds) ? clubIds : clubIds ? [clubIds] : [];
    if (assignedClubs.length > 0) {
      await prisma.club.updateMany({
        where: { id: { in: assignedClubs } },
        data: { facultyInchargeId: newFaculty.id },
      });
    }

    const safeObj = { ...newFaculty, clubIds: assignedClubs };
    delete safeObj.password;
    res.status(201).json(safeObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Faculty account', details: err.message });
  }
};

/**
 * GET /api/users/department-students
 */
const getDepartmentStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const authUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!authUser) return res.status(404).json({ error: 'User account not found' });

    if (!['HOD', 'FACULTY_INCHARGE', 'DSW'].includes(authUser.role)) {
      return res.status(403).json({ error: 'Forbidden: Access restricted to HOD, Faculty, and DSW' });
    }

    let students;
    if (authUser.role === 'DSW') {
      students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { name: 'asc' },
      });
    } else {
      const dept = (authUser.department || authUser.branch || '').trim();
      if (!dept) return res.status(400).json({ error: 'No department assigned to your account.' });

      students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          OR: [
            { department: { equals: dept, mode: 'insensitive' } },
            { branch: { equals: dept, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
      });
    }

    const safeStudents = students.map(s => {
      const { password, ...rest } = s;
      return rest;
    });

    res.json(safeStudents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch department students', details: err.message });
  }
};

/**
 * DELETE /api/users/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const authUserId = req.user.id;

    const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
    if (!authUser) return res.status(404).json({ error: 'Authenticated user not found' });

    if (authUser.role !== 'FACULTY_INCHARGE' && authUser.role !== 'DSW') {
      return res.status(403).json({ error: 'Forbidden: Only Faculty Incharge and DSW can delete students.' });
    }

    const targetStudent = await prisma.user.findUnique({ where: { id: studentId } });
    if (!targetStudent || targetStudent.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const authDept = (authUser.department || authUser.branch || '').trim().toLowerCase();
    const studentDept = (targetStudent.department || targetStudent.branch || '').trim().toLowerCase();

    if (
      authUser.role === 'FACULTY_INCHARGE' &&
      authDept &&
      studentDept &&
      authDept !== studentDept &&
      !authDept.includes(studentDept) &&
      !studentDept.includes(authDept)
    ) {
      return res.status(403).json({ error: 'Forbidden: You can only delete students belonging to your assigned department.' });
    }

    await prisma.$transaction([
      prisma.clubCoordinator.deleteMany({ where: { userId: studentId } }),
      prisma.clubMember.deleteMany({ where: { userId: studentId } }),
      prisma.eventRegistration.deleteMany({ where: { userId: studentId } }),
      prisma.attendance.deleteMany({ where: { userId: studentId } }),
      prisma.notification.deleteMany({ where: { userId: studentId } }),
      prisma.activityLog.deleteMany({ where: { userId: studentId } }),
      prisma.user.delete({ where: { id: studentId } }),
    ]);

    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student', details: err.message });
  }
};

/**
 * PUT /api/users/profile
 */
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, rollNumber, department, branch, year, semester } = req.body;

    const authUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!authUser) return res.status(404).json({ error: 'User account not found' });

    if (authUser.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: Only students can update their profile' });
    }

    const cleanName = (name || '').trim();
    if (!cleanName) return res.status(400).json({ error: 'Full Name is required.' });

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return res.status(400).json({ error: 'College Email is required.' });

    const cleanRollNumber = (rollNumber || '').trim();
    if (!cleanRollNumber) return res.status(400).json({ error: 'Roll Number is required.' });

    if (!/^\d{10,15}$/.test(cleanRollNumber)) {
      return res.status(400).json({ error: 'Roll number must consist of 10 to 15 digits only.' });
    }

    const cleanDept = (department || branch || '').trim();
    if (!cleanDept) return res.status(400).json({ error: 'Academic Branch / Department is required.' });

    const targetYear = year ? year.trim() : authUser.year;
    const targetSemester = semester ? semester.trim() : authUser.semester;

    const VALID_SEMESTERS_BY_YEAR = {
      '1st Year': ['Semester 1', 'Semester 2'],
      '2nd Year': ['Semester 3', 'Semester 4'],
      '3rd Year': ['Semester 5', 'Semester 6'],
      '4th Year': ['Semester 7', 'Semester 8'],
    };

    const validSemesters = VALID_SEMESTERS_BY_YEAR[targetYear];
    if (validSemesters && !validSemesters.includes(targetSemester)) {
      return res.status(400).json({
        error: `Invalid semester (${targetSemester}) for ${targetYear}. Allowed semesters: ${validSemesters.join(', ')}.`
      });
    }

    const existingEmailUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
        NOT: { id: userId },
      },
    });
    if (existingEmailUser) return res.status(400).json({ error: 'Email is already registered.' });

    const existingRollUser = await prisma.user.findFirst({
      where: {
        rollNumber: { equals: cleanRollNumber, mode: 'insensitive' },
        NOT: { id: userId },
      },
    });
    if (existingRollUser) return res.status(400).json({ error: 'Roll number already exists.' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: cleanName,
        email: cleanEmail,
        rollNumber: cleanRollNumber,
        department: cleanDept,
        branch: cleanDept,
        year: targetYear,
        semester: targetSemester,
      },
    });

    const { password, ...safeUser } = updatedUser;
    res.json({ message: 'Profile updated successfully.', user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};

/**
 * DELETE /api/users/:id
 * Deletes staff or student account (DSW only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const authUserId = req.user.id;

    if (req.user.role !== 'DSW') {
      return res.status(403).json({ error: 'Forbidden: Only DSW can delete user accounts.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ error: 'User record not found.' });
    if (targetUser.role === 'DSW') return res.status(403).json({ error: 'DSW account cannot be deleted.' });

    if (targetUser.role === 'FACULTY_INCHARGE') {
      await prisma.club.updateMany({
        where: { facultyInchargeId: targetUserId },
        data: { facultyInchargeId: null },
      });
    }

    await prisma.$transaction([
      prisma.clubCoordinator.deleteMany({ where: { userId: targetUserId } }),
      prisma.clubMember.deleteMany({ where: { userId: targetUserId } }),
      prisma.eventRegistration.deleteMany({ where: { userId: targetUserId } }),
      prisma.attendance.deleteMany({ where: { userId: targetUserId } }),
      prisma.notification.deleteMany({ where: { userId: targetUserId } }),
      prisma.activityLog.deleteMany({ where: { userId: targetUserId } }),
      prisma.user.delete({ where: { id: targetUserId } }),
    ]);

    res.json({ message: `${targetUser.role} account deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user account', details: err.message });
  }
};

module.exports = {
  getAllUsers,
  getStaffAccounts,
  getUserStats,
  createHod,
  createFaculty,
  getDepartmentStudents,
  deleteStudent,
  updateStudentProfile,
  deleteUser,
};
