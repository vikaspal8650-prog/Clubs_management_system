const { PrismaClient } = require('@prisma/client');

// A single client prevents connection-pool exhaustion when the application grows.
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
