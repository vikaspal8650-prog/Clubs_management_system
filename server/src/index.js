require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { prisma, connectDatabase, isDatabaseReady } = require('./db');

const authRoutes = require('./routes/auth.routes');
const clubRoutes = require('./routes/club.routes');
const eventRoutes = require('./routes/event.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const certificateRoutes = require('./routes/certificate.routes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cookie Parser
app.use(cookieParser());

// CORS Configuration allowing credentials (cookies)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Return a meaningful response while PostgreSQL is unavailable instead of
// letting individual Prisma requests fail as opaque connection errors.
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || isDatabaseReady()) return next();
  return res.status(503).json({ error: 'Database service is currently unavailable.' });
});

// Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login/registration attempts, please try again after 15 minutes.' }
});

// Health check route
app.get('/api/health', (req, res) => {
  const database = isDatabaseReady() ? 'connected' : 'unavailable';
  res.status(isDatabaseReady() ? 200 : 503).json({
    success: isDatabaseReady(),
    message: isDatabaseReady() ? 'Backend is running' : 'Backend is running but the database is unavailable',
    database,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/certificates', certificateRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'CCMS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON request body.' });
  if (err.message?.startsWith('CORS origin not allowed')) return res.status(403).json({ error: 'Request origin is not allowed.' });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3001;
const start = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must contain at least 32 characters. Set a unique secret in server/.env before starting the server.');
    process.exitCode = 1;
    return;
  }
  const connected = await connectDatabase();
  if (!connected) {
    console.error('API will return 503 until PostgreSQL becomes available; retrying connection every 10 seconds.');
    const retryTimer = setInterval(async () => {
      if (await connectDatabase()) clearInterval(retryTimer);
    }, 10_000);
  }
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

process.on('unhandledRejection', (error) => console.error('Unhandled promise rejection:', error));
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

start();
