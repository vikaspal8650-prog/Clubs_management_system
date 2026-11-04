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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    if (!user || user.status !== 'ACTIVE' || (decoded.tokenVersion ?? 0) !== user.tokenVersion) {
      return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (error) {
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
