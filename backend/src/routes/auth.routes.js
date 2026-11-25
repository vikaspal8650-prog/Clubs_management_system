const express = require('express');
const router = express.Router();
const { login, register, logout, refresh, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const crypto = require('crypto');

// Account buckets use an HMAC key so raw email addresses are never written
// into limiter storage (including Redis keys).
const accountKey = (req) => crypto
  .createHmac('sha256', process.env.RATE_LIMIT_KEY_SECRET || process.env.JWT_SECRET || 'development-only')
  .update(`${String(req.body?.email || 'unknown').trim().toLowerCase()}\u0000${req.ip ? ipKeyGenerator(req.ip) : 'unknown-ip'}`)
  .digest('hex');

if (process.env.REDIS_URL) {
  throw new Error('REDIS_URL is configured, but Redis rate-limit packages are not installed. Install redis and rate-limit-redis before enabling multi-instance deployment.');
}

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

const registrationLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

const loginIpLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { error: 'Too many login attempts from this network. Please try again shortly.' },
});

const loginAccountLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: accountKey,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed login attempts for this account. Please try again in 15 minutes.' },
});

router.post('/login', loginIpLimiter, loginAccountLimiter, login);
router.post('/register', registrationLimiter, register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
