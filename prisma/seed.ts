import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Seed Accounts
  const accountsData = [
    { name: 'Caja (Efectivo)', type: 'cash' },
    { name: 'Banco principal', type: 'bank' },
    { name: 'Banco reserva (Impuestos)', type: 'reserve' }
  ]

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { id: acc.name }, // Hack to avoid dupes if id isn't name, but without an easy unique constraint, we'll try something else
      update: {},
      create: { name: acc.name, type: acc.type }
    }).catch(async () => {
      // If it fails, maybe it already exists. Let's just check by name
      const existing = await prisma.account.findFirst({ where: { name: acc.name } })
      if (!existing) {
        await prisma.account.create({ data: { name: acc.name, type: acc.type }})
      }
    })
  }

  // Proper fallback: Check by name
  for (const acc of accountsData) {
    const existing = await prisma.account.findFirst({ where: { name: acc.name } })
    if (!existing) {
      await prisma.account.create({ data: { name: acc.name, type: acc.type }})
    }
  }

  // 2. Seed Employees
  const employees = ['Silvia', 'Luz', 'Patri']
  for (const emp of employees) {
    const existing = await prisma.employee.findUnique({ where: { name: emp } })
    if (!existing) {
        await prisma.employee.create({ data: { name: emp } })
    }
  }

  // 3. Seed Expense Categories
  const categories = [
    { name: 'product_suppliers', label: 'Proveedores de Producto' },
    { name: 'disposables', label: 'Desechables' },
    { name: 'rent', label: 'Alquiler' },
    { name: 'utilities', label: 'Suministros (Luz, Agua, Internet)' },
    { name: 'software', label: 'Software / Suscripciones' },
    { name: 'accounting', label: 'Gestoría' },
    { name: 'general_expenses', label: 'Gastos Generales / Varios' }
  ]

  for (const cat of categories) {
    const existing = await prisma.expenseCategory.findUnique({ where: { name: cat.name } })
    if (!existing) {
      await prisma.expenseCategory.create({ data: cat })
    } else {
      await prisma.expenseCategory.update({ where: { name: cat.name }, data: { label: cat.label } })
    }
  }

  // Just to be sure we don't have payroll/taxes messing up the DB if we fetch all categories later
  await prisma.expenseCategory.deleteMany({
    where: { name: { in: ['payroll', 'taxes'] } }
  }).catch(() => {}) // Ignore if they dont exist

  console.log("Seed completed: Accounts, Employees, and ExpenseCategories initialized.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
