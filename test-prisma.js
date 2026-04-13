const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const s = await prisma.supplier.create({ data: { name: 'Ibertest123' } });
    console.log("Success:", s);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
