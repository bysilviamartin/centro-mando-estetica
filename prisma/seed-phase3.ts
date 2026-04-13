import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Phase 3 Cleanup and Seeding...");

  // 1. Treasury Accounts
  console.log("Normalizing Treasury Accounts...");
  const expectedAccounts = [
    { name: "Caja", type: "cash" },
    { name: "Banco principal", type: "bank" },
    { name: "Banco reserva", type: "reserve" }
  ];

  for (const acc of expectedAccounts) {
    const existing = await prisma.account.findFirst({
      where: { name: acc.name }
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          name: acc.name,
          type: acc.type,
          initialBalance: 0,
          active: true
        }
      });
      console.log(`Created account: ${acc.name}`);
    } else {
      await prisma.account.update({
        where: { id: existing.id },
        data: { active: true }
      });
    }
  }

  // Disable any other accounts
  const expectedAccountNames = expectedAccounts.map(a => a.name);
  await prisma.account.updateMany({
    where: {
      name: { notIn: expectedAccountNames }
    },
    data: { active: false }
  });

  // 2. Expense Categories
  console.log("Normalizing Expense Categories...");
  const expectedCategories = [
    { name: "proveedores_producto", label: "Proveedores de producto" },
    { name: "desechables", label: "Desechables" },
    { name: "alquiler", label: "Alquiler" },
    { name: "suministros", label: "Suministros" },
    { name: "software_suscripciones", label: "Software / Suscripciones" },
    { name: "gestoria", label: "Gestoría" },
    { name: "gastos_bancarios", label: "Gastos bancarios" },
    { name: "amortizaciones", label: "Amortizaciones" },
    { name: "seguros", label: "Seguros" },
    { name: "gastos_generales", label: "Gastos generales / varios" }
  ];

  for (const cat of expectedCategories) {
    const existing = await prisma.expenseCategory.findUnique({
      where: { name: cat.name }
    });
    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          name: cat.name,
          label: cat.label
        }
      });
      console.log(`Created expense category: ${cat.label}`);
    }
  }

  // Delete categories outside the target list IF they don't have expenses attached,
  // otherwise we can just rename/hide them, but for this cleanup script, if they have expenses, we should probably re-assign to Gastos generales or keep them.
  // The prompt said: "Expense categories must be exactly the expected real categories and must not include payroll or taxes."
  // Since we only query categories unconditionally in frontend, let's delete those ending up empty or reassign their expenses.
  const generalCategory = await prisma.expenseCategory.findUnique({ where: { name: "gastos_generales" } });
  
  if (generalCategory) {
    const allCategories = await prisma.expenseCategory.findMany();
    for (const c of allCategories) {
      if (!expectedCategories.find(ec => ec.name === c.name)) {
        console.log(`Reassigning expenses and deleting category: ${c.label}`);
        await prisma.expense.updateMany({
          where: { expenseCategoryId: c.id },
          data: { expenseCategoryId: generalCategory.id }
        });
        await prisma.expenseCategory.delete({
          where: { id: c.id }
        });
      }
    }
  }

  // 3. Employees
  console.log("Normalizing Employees...");
  const expectedEmployees = ["Silvia", "Luz", "Patri"];

  for (const empName of expectedEmployees) {
    const existing = await prisma.employee.findUnique({
      where: { name: empName }
    });
    if (!existing) {
      await prisma.employee.create({
        data: {
          name: empName,
          active: true
        }
      });
      console.log(`Created employee: ${empName}`);
    } else {
      await prisma.employee.update({
        where: { id: existing.id },
        data: { active: true }
      });
    }
  }

  // Disable other employees
  await prisma.employee.updateMany({
    where: {
      name: { notIn: expectedEmployees }
    },
    data: { active: false }
  });

  console.log("Seed and cleanup completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
