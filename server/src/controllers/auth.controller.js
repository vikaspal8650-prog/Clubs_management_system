const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_SEMESTERS_BY_YEAR = {
  '1st Year': ['Semester 1', 'Semester 2'],
  '2nd Year': ['Semester 3', 'Semester 4'],
  '3rd Year': ['Semester 5', 'Semester 6'],
  '4th Year': ['Semester 7', 'Semester 8'],
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special symbol (e.g. @, #, $, !).';
  }
  return null;
};

const validateRollNumber = (rollNumber) => {
  if (!rollNumber || !/^\d{10,15}$/.test(rollNumber.trim())) {
    return 'Roll number must consist of 10 to 15 digits only.';
  }
  return null;
};

const setAuthCookies = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Please enter your college email address.' });
    if (!password || !password.trim()) return res.status(400).json({ error: 'Please enter your password.' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.status !== 'ACTIVE') return res.status(401).json({ error: 'Your account is currently inactive. Please contact the administrator.' });

    let isValid = false;
    let legacyMigrationDone = false;

    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      isValid = false;
    }

    // Migrate legacy plaintext passwords once, without account-specific aliases.
    if (!isValid && password === user.password) {
      isValid = true;
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        legacyMigrationDone = true;
        console.log(`[AUTH] Legacy/Alias password for user ${user.email} updated to bcrypt hash.`);
      } catch (hashErr) {
        console.error('[AUTH] Failed to update password hash:', hashErr);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setAuthCookies(res, token);

    const assignments = await prisma.clubCoordinator.findMany({ where: { userId: user.id, status: 'ACTIVE' }, include: { club: { select: { id: true, name: true } }, faculty: { select: { id: true, name: true } } } });
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.tokenVersion;
    userObj.coordinatorAssignments = assignments.map(({ clubId, status, facultyId, club, faculty }) => ({ clubId, status, facultyId, clubName: club.name, facultyName: faculty?.name || 'Unassigned' }));
    userObj.coordinatorOfClubs = userObj.coordinatorAssignments.map((assignment) => assignment.clubId);

    res.json({ user: userObj, message: legacyMigrationDone ? 'Login successful. Password updated securely.' : 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, rollNumber, branch, year, semester, password } = req.body;

    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'College Email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (!branch || !branch.trim()) return res.status(400).json({ error: 'Academic Branch is required.' });
    if (!year || !year.trim()) return res.status(400).json({ error: 'Academic Year is required.' });
    if (!semester || !semester.trim()) return res.status(400).json({ error: 'Current Semester is required.' });

    // Validate Roll Number
    const rollError = validateRollNumber(rollNumber);
    if (rollError) return res.status(400).json({ error: rollError });

    // Validate Password
    const passError = validatePassword(password);
    if (passError) return res.status(400).json({ error: passError });

    // Validate Year-to-Semester dependency
    const validSemesters = VALID_SEMESTERS_BY_YEAR[year];
    if (validSemesters && !validSemesters.includes(semester)) {
      return res.status(400).json({
        error: `Invalid semester (${semester}) for ${year}. Allowed semesters: ${validSemesters.join(', ')}.`
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRollNumber = rollNumber.trim();

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email address is already registered.' });

    const existingRoll = await prisma.user.findFirst({
      where: { rollNumber: { equals: cleanRollNumber, mode: 'insensitive' } }
    });
    if (existingRoll) {
      return res.status(400).json({ error: 'Roll number already exists. Please enter a unique roll number.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        rollNumber: cleanRollNumber,
        password: hashedPassword,
        department: branch,
        branch,
        year,
        semester,
        role: 'STUDENT',
        status: 'ACTIVE'
      }
    });

    const userObj = { ...newUser };
    delete userObj.password;

    res.status(201).json({ user: userObj, message: 'Student registered successfully. Please log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email or roll number is already registered.' });
    res.status(500).json({ error: 'Registration failed.' });
  }
};

const logout = async (req, res) => {
  if (req.user?.id) {
    try {
      await prisma.user.update({ where: { id: req.user.id }, data: { tokenVersion: { increment: 1 } } });
    } catch (err) {
      console.error('Logout token invalidation failed:', err.message);
      return res.status(503).json({ error: 'Could not safely invalidate this session. Please retry logout.' });
    }
  }
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
  res.clearCookie('accessToken', cookieOptions);
  res.json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.tokenVersion;
    if (user.role === 'STUDENT') {
      const assignments = await prisma.clubCoordinator.findMany({ where: { userId: user.id, status: 'ACTIVE' }, include: { club: { select: { id: true, name: true } }, faculty: { select: { id: true, name: true } } } });
      userObj.coordinatorAssignments = assignments.map(({ clubId, status, facultyId, club, faculty }) => ({ clubId, status, facultyId, clubName: club.name, facultyName: faculty?.name || 'Unassigned' }));
      userObj.coordinatorOfClubs = userObj.coordinatorAssignments.map((assignment) => assignment.clubId);
    }
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

module.exports = { login, register, logout, me, validatePassword, validateRollNumber };
