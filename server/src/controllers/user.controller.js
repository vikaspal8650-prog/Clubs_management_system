const bcrypt = require('bcrypt');
const { prisma } = require('../db');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateStaffPassword = (password) => typeof password === 'string' && password.length >= 8 && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

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
    const where = { role: { in: ['HOD', 'FACULTY_INCHARGE'] } };
    if (req.user.role !== 'DSW') {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { department: true } });
      where.department = currentUser?.department || '__none__';
    }
    const staff = await prisma.user.findMany({
      where,
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

    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) return res.status(400).json({ error: 'A valid college email is required.' });
    if (typeof department !== 'string' || !department.trim()) return res.status(400).json({ error: 'Department is required.' });
    if (!validateStaffPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and include a lowercase letter, number, and special symbol.' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(400).json({ error: 'An account with this email address already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newHod = await prisma.user.create({
      data: {
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
    if (err.code === 'P2002') return res.status(409).json({ error: 'An account with this email address already exists.' });
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

    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) return res.status(400).json({ error: 'A valid college email is required.' });
    if (typeof department !== 'string' || !department.trim()) return res.status(400).json({ error: 'Department is required.' });
    if (!validateStaffPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and include a lowercase letter, number, and special symbol.' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(400).json({ error: 'An account with this email address already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedClubs = Array.isArray(clubIds) ? clubIds : clubIds ? [clubIds] : [];
    const uniqueClubIds = [...new Set(assignedClubs)];
    const newFaculty = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'FACULTY_INCHARGE',
          department: department.trim(),
          status: 'ACTIVE',
        },
      });
      if (uniqueClubIds.length) {
        const result = await tx.club.updateMany({
          where: { id: { in: uniqueClubIds }, department: { equals: department.trim(), mode: 'insensitive' } },
          data: { facultyInchargeId: created.id },
        });
        if (result.count !== uniqueClubIds.length) {
          throw Object.assign(new Error('One or more selected clubs do not belong to this department.'), { status: 400 });
        }
      }
      return created;
    });

    const safeObj = { ...newFaculty, clubIds: uniqueClubIds };
    delete safeObj.password;
    res.status(201).json(safeObj);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'An account with this email address already exists.' });
    if (err.status === 400) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Failed to create Faculty account', details: err.message });
  }
};

/**
 * GET /api/users/department-students
 *
 * Fetches students belonging to the authenticated faculty/HOD's department.
 *
 * Matching strategy (applied in order, stops at first non-empty result):
 *  1. Exact case-insensitive match on department or branch.
 *  2. Keyword-based partial match — splits the faculty's department string into
 *     significant words (≥3 chars, ignoring common stop-words) and returns
 *     students whose department or branch contains ANY of those keywords.
 *     This handles mismatches like "computer science and engineering" vs
 *     "Computer Science" or "Computer Science & Engineering".
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

      // --- Strategy 1: exact case-insensitive match ---
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

      // --- Strategy 2: multi-keyword AND match (fallback) ---
      // When exact match returns nothing, extract significant keywords from the
      // faculty's department string and require ALL of them to appear in the
      // student's department/branch. This prevents broad words like "engineering"
      // from pulling in unrelated departments (e.g. a "Computer Science and
      // Engineering" faculty would NOT see "Mechanical Engineering" students
      // because "computer" must also match).
      if (students.length === 0) {
        const STOP_WORDS = new Set(['and', 'of', 'the', 'in', 'for', 'a', 'an', '&', 'to']);
        const keywords = dept
          .toLowerCase()
          .split(/[\s&,]+/)
          .map((w) => w.replace(/[^a-z0-9]/g, ''))
          .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
          .sort((a, b) => b.length - a.length); // longest (most specific) first

        if (keywords.length > 0) {
          const [primaryKw, ...restKws] = keywords;

          // Fetch all students whose dept/branch contains the primary keyword
          const candidateStudents = await prisma.user.findMany({
            where: {
              role: 'STUDENT',
              OR: [
                { department: { contains: primaryKw, mode: 'insensitive' } },
                { branch: { contains: primaryKw, mode: 'insensitive' } },
              ],
            },
            orderBy: { name: 'asc' },
          });

          // Apply AND-filter for remaining keywords in JS
          if (restKws.length > 0) {
            const andFiltered = candidateStudents.filter((s) => {
              const haystack = `${s.department || ''} ${s.branch || ''}`.toLowerCase();
              return restKws.every((kw) => haystack.includes(kw));
            });
            // If AND-filter eliminated every candidate, fall back to the broader set
            students = andFiltered.length > 0 ? andFiltered : candidateStudents;
          } else {
            students = candidateStudents;
          }
        }
      }
    }

    const safeStudents = await Promise.all(students.map(async (s) => {
      const { password, ...rest } = s;
      if (s.role !== 'STUDENT') return rest;
      const assignments = await prisma.clubCoordinator.findMany({ where: { userId: s.id, status: 'ACTIVE' }, include: { club: { select: { id: true, name: true } }, faculty: { select: { id: true, name: true } } } });
      rest.coordinatorAssignments = assignments.map(({ clubId, status, facultyId, club, faculty }) => ({ clubId, status, facultyId, clubName: club.name, facultyName: faculty?.name || 'Unassigned' }));
      rest.coordinatorOfClubs = rest.coordinatorAssignments.map((assignment) => assignment.clubId);
      return rest;
    }));

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

    if (authUser.role === 'FACULTY_INCHARGE') {
      const [membership, coordinatorAssignment] = await Promise.all([
        prisma.club.findFirst({ where: { facultyInchargeId: authUser.id, members: { some: { userId: studentId } } } }),
        prisma.club.findFirst({ where: { facultyInchargeId: authUser.id, coordinators: { some: { userId: studentId, status: 'ACTIVE' } } } }),
      ]);
      if ((!authDept || !studentDept || authDept !== studentDept) && !membership && !coordinatorAssignment) {
        return res.status(403).json({ error: 'You can only manage students in your department or assigned clubs.' });
      }
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
    if (err.code === 'P2003') return res.status(409).json({ error: 'This account is linked to retained certificate records and cannot be deleted.' });
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
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email or roll number is already registered.' });
    res.status(500).json({ error: 'Failed to update profile.' });
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

    await prisma.$transaction(async (tx) => {
      if (targetUser.role === 'FACULTY_INCHARGE') {
        await tx.club.updateMany({ where: { facultyInchargeId: targetUserId }, data: { facultyInchargeId: null } });
      }
      await tx.clubCoordinator.deleteMany({ where: { userId: targetUserId } });
      await tx.clubMember.deleteMany({ where: { userId: targetUserId } });
      await tx.eventRegistration.deleteMany({ where: { userId: targetUserId } });
      await tx.attendance.deleteMany({ where: { userId: targetUserId } });
      await tx.notification.deleteMany({ where: { userId: targetUserId } });
      await tx.activityLog.deleteMany({ where: { userId: targetUserId } });
      await tx.user.delete({ where: { id: targetUserId } });
    });

    res.json({ message: `${targetUser.role} account deleted successfully.` });
  } catch (err) {
    if (err.code === 'P2003') return res.status(409).json({ error: 'This account is linked to retained certificate records and cannot be deleted.' });
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
