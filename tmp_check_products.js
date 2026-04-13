const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const products = await prisma.product.findMany();
    console.log("TOTAL PRODUCTS:", products.length);
    console.log("PRODUCTS (first 5):", products.slice(0, 5));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
