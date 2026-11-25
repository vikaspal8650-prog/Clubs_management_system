const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Authentication required. Please log in.' });

    if (!process.env.JWT_SECRET) throw new Error('Server authentication is not configured.');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.exp) res.set('X-Access-Token-Expires-At', String(decoded.exp * 1000));
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    if (!user || user.status !== 'ACTIVE' || (decoded.tokenVersion ?? 0) !== user.tokenVersion) {
      return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    }
    if (decoded.sessionId) {
      const session = await prisma.refreshSession.findUnique({ where: { id: decoded.sessionId }, select: { userId: true, revokedAt: true, expiresAt: true } });
      if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    }
    req.user = { ...user, sessionId: decoded.sessionId };
    next();
  } catch (error) {
    if (['P2021', 'P2022'].includes(error.code)) {
      console.error('Authentication storage migration is missing:', { code: error.code, message: error.message });
      return res.status(503).json({ code: 'AUTH_STORAGE_NOT_READY', error: 'Authentication storage is not ready. Apply the pending Prisma migration, then retry.' });
    }
    if (['P1000', 'P1001', 'P1002', 'P1017'].includes(error.code)) {
      console.error('Authentication database unavailable:', { code: error.code, message: error.message });
      return res.status(503).json({ code: 'AUTH_DATABASE_UNAVAILABLE', error: 'Authentication database is temporarily unavailable. Please retry shortly.' });
    }
    console.error('Authentication request failed:', { code: error.code || 'UNKNOWN', name: error.name || 'Error', message: error.message || 'No error message provided' });
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
