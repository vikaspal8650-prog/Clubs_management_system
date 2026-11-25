const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const cookieOptions = (maxAge) => {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(configuredSameSite) ? configuredSameSite : 'lax';
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    ...(domain ? { domain } : {}),
    path: '/',
    maxAge,
  };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const expiresAt = jwt.decode(accessToken)?.exp * 1000;
  if (expiresAt) res.set('X-Access-Token-Expires-At', String(expiresAt));
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  if (refreshToken) res.cookie('refreshToken', refreshToken, { ...cookieOptions(7 * 24 * 60 * 60 * 1000), path: '/api/auth' });
};

const makeAccessToken = (user, sessionId) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, sessionId },
  JWT_SECRET,
  { expiresIn: '15m' }
);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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
    try { isValid = await bcrypt.compare(password, user.password); } catch (e) { isValid = false; }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionId = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    await prisma.refreshSession.create({ data: { id: sessionId, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    setAuthCookies(res, makeAccessToken(user, sessionId), refreshToken);

    const assignments = await prisma.clubCoordinator.findMany({ where: { userId: user.id, status: 'ACTIVE' }, include: { club: { select: { id: true, name: true } }, faculty: { select: { id: true, name: true } } } });
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.tokenVersion;
    userObj.coordinatorAssignments = assignments.map(({ clubId, status, facultyId, club, faculty }) => ({ clubId, status, facultyId, clubName: club.name, facultyName: faculty?.name || 'Unassigned' }));
    userObj.coordinatorOfClubs = userObj.coordinatorAssignments.map((assignment) => assignment.clubId);

    res.json({ user: userObj, message: 'Login successful.' });
  } catch (err) {
    console.error('Login request failed:', err.message);
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
    console.error('Registration request failed:', err.message);
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(' ').toLowerCase() : String(err.meta?.target || '').toLowerCase();
      if (target.includes('email')) return res.status(409).json({ error: 'An account with this email address is already registered.' });
      if (target.includes('rollnumber') || target.includes('roll_number')) return res.status(409).json({ error: 'Roll number already exists. Please enter a unique roll number.' });
      return res.status(409).json({ error: 'An account with these details is already registered.' });
    }
    res.status(500).json({ error: 'Registration failed.' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const sessionId = req.user?.sessionId || (refreshToken ? (await prisma.refreshSession.findUnique({ where: { tokenHash: hashToken(refreshToken) }, select: { id: true } }))?.id : null);
    if (sessionId) {
      await prisma.refreshSession.updateMany({ where: { id: sessionId, ...(req.user?.id ? { userId: req.user.id } : {}), revokedAt: null }, data: { revokedAt: new Date() } });
    }
  } catch (err) {
    console.error('Logout token invalidation failed:', err.message);
    return res.status(503).json({ error: 'Could not safely invalidate this session. Please retry logout.' });
  }
  res.clearCookie('accessToken', cookieOptions());
  res.clearCookie('refreshToken', { ...cookieOptions(), path: '/api/auth' });
  res.json({ message: 'Logged out successfully' });
};

const refresh = async (req, res) => {
  const oldToken = req.cookies?.refreshToken;
  if (!oldToken) return res.status(401).json({ error: 'Refresh session is unavailable.' });
  try {
    const session = await prisma.refreshSession.findUnique({ where: { tokenHash: hashToken(oldToken) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Refresh session is invalid or expired.' });
    }
    const nextToken = crypto.randomBytes(48).toString('base64url');
    const updated = await prisma.refreshSession.updateMany({ where: { id: session.id, tokenHash: session.tokenHash, revokedAt: null }, data: { tokenHash: hashToken(nextToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    if (updated.count !== 1) return res.status(401).json({ error: 'Refresh session has already been rotated.' });
    setAuthCookies(res, makeAccessToken(session.user, session.id), nextToken);
    res.json({ message: 'Session refreshed.' });
  } catch (err) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Session refresh failed:`, { code: err.code || 'UNKNOWN', name: err.name || 'Error', message: err.message || 'No error message provided' });
    if (['P2021', 'P2022'].includes(err.code)) {
      return res.status(503).json({ code: 'AUTH_STORAGE_NOT_READY', error: 'Authentication storage is not ready. Apply the pending Prisma migration, then retry.', requestId });
    }
    if (['P1000', 'P1001', 'P1002', 'P1017'].includes(err.code)) {
      return res.status(503).json({ code: 'AUTH_DATABASE_UNAVAILABLE', error: 'Authentication database is temporarily unavailable. Please retry shortly.', requestId });
    }
    res.status(503).json({ code: 'AUTH_REFRESH_FAILED', error: 'Session refresh is temporarily unavailable. Please retry shortly.', requestId });
  }
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

module.exports = { login, register, logout, refresh, me, validatePassword, validateRollNumber };
