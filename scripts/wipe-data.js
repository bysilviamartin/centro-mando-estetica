const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Initiating total data wipe. Connecting to database...');

  try {
    // We execute inside a transaction when possible, or just sequential.
    // Deleting in correct reverse-foreign-key order to avoid constraint violations.

    console.log('1. Deleting Documents...');
    await prisma.document.deleteMany();

    console.log('2. Deleting PaymentInstallments (Plazos de pago)...');
    await prisma.paymentInstallment.deleteMany();

    console.log('3. Deleting Imported Items & Sessions (Koibox)...');
    await prisma.importedSale.deleteMany();
    await prisma.importedMovement.deleteMany();
    await prisma.dailyCashSummary.deleteMany();
    await prisma.importSession.deleteMany();

    console.log('4. Deleting Core Obligations (Gastos, Nóminas, Impuestos)...');
    await prisma.expense.deleteMany();
    await prisma.payrollEntry.deleteMany();
    await prisma.taxEntry.deleteMany();

    console.log('5. Deleting Treasury Movements...');
    await prisma.treasuryMovement.deleteMany();

    console.log('6. Deleting Daily Cash (Cierres de Caja Diaria)...');
    await prisma.dailyCash.deleteMany();

    console.log('7. Deleting Entities & Catalogs (Proveedores, Servicios, Empleados, etc)...');
    await prisma.supplier.deleteMany();
    await prisma.service.deleteMany();
    await prisma.product.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.employee.deleteMany();
    
    console.log('8. Deleting Rules and Alerts...');
    await prisma.classificationRule.deleteMany();
    await prisma.alert.deleteMany();

    console.log('--- WIPE COMPLETE ---');
    console.log('Preserved structural tables: BusinessSettings, ExpenseCategory, Account');

  } catch (error) {
    console.error('Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected.');
  }
}

main();
