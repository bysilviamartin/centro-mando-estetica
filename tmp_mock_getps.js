const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { internalUse: false },
    orderBy: { name: "asc" }
  });
  console.log("Found products for UI:", products.length);
  if (products.length > 0) {
    console.log("First Name:", products[0].name);
    console.log("Internal Use:", products[0].internalUse);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
