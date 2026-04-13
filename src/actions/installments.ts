"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInstallment(data: any) {
  try {
    const installment = await prisma.paymentInstallment.create({
      data: {
        expenseId: data.expenseId || null,
        taxEntryId: data.taxEntryId || null,
        payrollEntryId: data.payrollEntryId || null,
        amount: data.amount,
        expectedDate: new Date(data.expectedDate),
        status: "pending"
      }
    });
    
    // Phase 3 Sync: Always check the global status when creating a new valid installment
    if (data.expenseId) {
       await syncExpensePaymentStatus(data.expenseId);
    }

    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true, installment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInstallment(id: string, data: any) {
  try {
    const current = await prisma.paymentInstallment.findUnique({ where: { id } });
    if (!current) throw new Error("Plazo no encontrado");

    // If we are marking a pending installment as paid
    if (current.status === "pending" && data.status === "paid") {
      if (!data.treasuryAccountId) throw new Error("Se requiere una cuenta de tesorería para pagar.");
      
      const parsedPaidDate = data.paidDate ? new Date(data.paidDate) : new Date();

      // Create the treasury movement
      const movement = await prisma.treasuryMovement.create({
        data: {
          type: "outflow",
          sourceAccountId: data.treasuryAccountId,
          amount: current.amount,
          description: `Pago Fraccionado: ${data.description || 'Obligación'}`,
          externalEntity: data.externalEntity || "Acreedor / Proveedor",
          date: parsedPaidDate,
        }
      });

      // Update the installment to link it. We don't change expectedDate or original amount.
      await prisma.paymentInstallment.update({
        where: { id },
        data: {
          status: "paid",
          paidDate: parsedPaidDate,
          treasuryAccountId: data.treasuryAccountId,
          treasuryMovementId: movement.id
        }
      });

    } else if (current.status === "paid" && data.status === "pending") {
      // Reverting a paid installment back to pending.
      // We must delete the associated treasury movement to avoid duplication and false accounting.
      if (current.treasuryMovementId) {
        await prisma.treasuryMovement.delete({
          where: { id: current.treasuryMovementId }
        });
      }
      
      await prisma.paymentInstallment.update({
        where: { id },
        data: {
          status: "pending",
          paidDate: null,
          treasuryAccountId: null,
          treasuryMovementId: null
        }
      });
      
    } else {
      // Just updating dates, amounts or status generically
      const updateData: any = {};
      
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.expectedDate !== undefined) updateData.expectedDate = new Date(data.expectedDate);
      if (data.status !== undefined && data.status !== current.status) updateData.status = data.status;

      await prisma.paymentInstallment.update({
        where: { id },
        data: updateData
      });
    }

    // Phase 3 Sync: Update the parent Expense payment status based on all its installments
    if (current.expenseId) {
      await syncExpensePaymentStatus(current.expenseId);
    }

    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInstallment(id: string) {
  try {
    const current = await prisma.paymentInstallment.findUnique({ where: { id } });
    if (!current) throw new Error("Plazo no encontrado");
    
    if (current.status === "paid" || current.treasuryMovementId) {
      throw new Error("No se puede eliminar un plazo que ya está pagado. Reviértelo a pendiente primero.");
    }

    await prisma.paymentInstallment.delete({
      where: { id }
    });

    // Phase 3 Sync: Update parent after deletion
    if (current.expenseId) {
      await syncExpensePaymentStatus(current.expenseId);
    }

    revalidatePath("/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper para sincronizar el estado global de la obligación basándose fielmente en la suma de los plazos pagados
async function syncExpensePaymentStatus(expenseId: string) {
  const allInstallments = await prisma.paymentInstallment.findMany({
    where: { expenseId }
  });
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  
  if (!expense) return;

  // Calculamos la suma exacta de los plazos que están "paid"
  const sumPaid = allInstallments
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + i.amount, 0);

  const total = expense.totalAmount;
  let newStatus = "pending";

  // Usamos un epsilon de céntimo (0.01) para evitar errores de coma flotante en JS al sumar decimales
  if (sumPaid > 0.01 && (total - sumPaid) > 0.01) {
    newStatus = "partial";
  } else if (Math.abs(sumPaid - total) <= 0.01 || sumPaid > total) {
    newStatus = "paid";
  }

  // Comprobamos si el estado guardado es distinto del real para evitar writes innecesarios
  if (expense.paymentStatus !== newStatus) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { paymentStatus: newStatus }
    });
  }
}
