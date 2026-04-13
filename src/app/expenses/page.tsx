import prisma from "@/lib/prisma";
import { BookOpen } from "lucide-react";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const accounts = await prisma.account.findMany({
    where: { active: true }
  });

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { label: 'asc' }
  });

  // Fetch recent manual expenses
  const expenses = await prisma.expense.findMany({
    orderBy: { dueDate: 'desc' },
    include: {
      expenseCategory: true,
      supplier: true,
      treasuryAccount: true,
      documents: true,
      installments: true
    }
  });

  const payrolls = await prisma.payrollEntry.findMany({
    orderBy: { date: 'desc' },
    include: { employee: true, documents: true, treasuryAccount: true }
  });

  const taxes = await prisma.taxEntry.findMany({
    orderBy: { date: 'desc' },
    include: { documents: true, treasuryAccount: true }
  });

  const employees = await prisma.employee.findMany({
    where: { active: true }
  });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <h1 className="page-title brand-font" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <BookOpen size={28} /> Gastos y Nóminas
      </h1>
      <p className="page-subtitle">Gestión centralizada de salidas de dinero (pagadas o pendientes).</p>

      <ExpensesClient 
        accounts={accounts} 
        categories={categories} 
        employees={employees}
        suppliers={suppliers}
        expenses={expenses}
        payrolls={payrolls}
        taxes={taxes}
      />
    </div>
  );
}
