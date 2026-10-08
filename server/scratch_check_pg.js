const { PrismaClient } = require('@prisma/client');

async function testConn(url) {
  process.env.DATABASE_URL = url;
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$connect();
    console.log('SUCCESS:', url);
    await client.$disconnect();
    return true;
  } catch (err) {
    console.log('FAILED:', url, err.message.split('\n')[0]);
    await client.$disconnect();
    return false;
  }
}

async function main() {
  const passwords = ['ccms_password', 'postgres', 'root', 'admin', '123456', 'password', ''];
  const users = ['ccms_user', 'postgres'];
  const dbs = ['ccms_db', 'postgres'];

  for (const u of users) {
    for (const p of passwords) {
      for (const db of dbs) {
        const url = `postgresql://${u}:${p}@localhost:5432/${db}?schema=public`;
        const res = await testConn(url);
        if (res) return;
      }
    }
  }
}

main();
