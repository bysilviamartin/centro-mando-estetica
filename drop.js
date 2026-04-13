const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS DailyCash');
    console.log("DailyCash table dropped successfully.");
  } catch(e) {
    console.error("Drop error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
