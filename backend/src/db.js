const { PrismaClient } = require('@prisma/client');

// A single client prevents connection-pool exhaustion when the application grows.
// The Prisma client owns one bounded PostgreSQL pool per backend process.
// Configure connection_limit in DATABASE_URL for the instance's pool budget.
const prisma = new PrismaClient();

let databaseReady = false;

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    databaseReady = true;
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    databaseReady = false;
    console.error('Database connection failed:', error.message);
    return false;
  }
};

const isDatabaseReady = () => databaseReady;

module.exports = { prisma, connectDatabase, isDatabaseReady };
