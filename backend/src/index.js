require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { prisma, connectDatabase, isDatabaseReady } = require('./db');

const authRoutes = require('./routes/auth.routes');
const clubRoutes = require('./routes/club.routes');
const eventRoutes = require('./routes/event.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const certificateRoutes = require('./routes/certificate.routes');
const analyticsRoutes = require('./routes/analytics.routes');

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
    } else callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  exposedHeaders: ['X-Access-Token-Expires-At']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
const uploadDir = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'uniclubs-uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.get('/uploads/:file', require('./middlewares/auth.middleware').authenticate, async (req, res, next) => {
  if (!/^[a-f0-9]{32}$/.test(req.params.file)) return res.status(404).end();
  try {
    const document = await prisma.document.findFirst({ where: { fileUrl: `/uploads/${req.params.file}` }, include: { event: { include: { club: true } } } });
    if (!document) return res.status(404).end();
    const { role, id } = req.user;
    const event = document.event;
    const department = role === 'HOD' ? await prisma.user.findUnique({ where: { id }, select: { department: true } }) : null;
    const isCoordinator = role === 'STUDENT' && event
      ? await prisma.clubCoordinator.findFirst({ where: { clubId: event.clubId, userId: id, status: 'ACTIVE' }, select: { id: true } })
      : null;
    const permitted = (role === 'DSW' && event)
      || (role === 'FACULTY_INCHARGE' && event && event.club.facultyInchargeId === id)
      || (role === 'HOD' && event && department?.department === event.club.department)
      || (role === 'STUDENT' && event && isCoordinator);
    if (!permitted) return res.status(403).json({ error: 'You are not authorized to access this document.' });
    const filename = path.basename(document.title).replace(/[\r\n"\\]/g, '_');
    res.sendFile(path.join(uploadDir, req.params.file), { headers: { 'Content-Disposition': `attachment; filename="${filename}"`, 'X-Content-Type-Options': 'nosniff' } }, (err) => { if (err && !res.headersSent) next(err); });
  } catch (error) { next(error); }
});
// Content-addressed upload IDs avoid user-controlled paths; checks rely on database readiness.

// Return a meaningful response while PostgreSQL is unavailable instead of
// letting individual Prisma requests fail as opaque connection errors.
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || isDatabaseReady()) return next();
  return res.status(503).json({ error: 'Database service is currently unavailable.' });
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
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'CCMS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}] ${err.name || 'Error'}: ${err.message || 'Request failed'}`);
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON request body.' });
  if (err.message?.startsWith('CORS origin not allowed')) return res.status(403).json({ error: 'Request origin is not allowed.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Uploaded file exceeds the 2 MB limit.' });
  if (err.message?.startsWith('Only PDF')) return res.status(400).json({ error: err.message });
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
let server;
let retryTimer;
let shuttingDown = false;

const start = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must contain at least 32 characters. Set a unique secret in backend/.env before starting the server.');
    process.exitCode = 1;
    return;
  }
  const connected = await connectDatabase();
  if (!connected) {
    console.error('API will return 503 until PostgreSQL becomes available; retrying connection every 10 seconds.');
    retryTimer = setInterval(async () => {
      if (await connectDatabase()) {
        clearInterval(retryTimer);
        retryTimer = undefined;
      }
    }, 10_000);
    retryTimer.unref();
  }
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(PORT, HOST);
    listener.once('listening', () => resolve(listener));
    listener.once('error', reject);
  });
  console.log(`Server listening on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
};

const shutdown = async (reason, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(exitCode || 1), 5_000);
  if (reason) console.error(reason);
  if (retryTimer) clearInterval(retryTimer);
  try {
    if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during backend shutdown:', error);
    exitCode = 1;
  }
  clearTimeout(forceExit);
  process.exit(exitCode);
};

process.on('unhandledRejection', (error) => { void shutdown(`Unhandled promise rejection: ${error?.stack || error}`, 1); });
process.on('uncaughtException', (error) => { void shutdown(`Uncaught exception: ${error?.stack || error}`, 1); });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await shutdown(`Received ${signal}; stopping backend.`);
  });
}

start().catch((error) => {
  void shutdown(`Backend startup failed: ${error?.stack || error}`, 1);
});
