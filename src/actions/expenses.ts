"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Expenses (Facturas & Gastos Operativos) ---
export async function createExpense(data: any) {
  try {
    console.log("[SERVER ACTION] createExpense CALLED WITH DATA:", data);
    
    // Phase 3 Enhancement: Free-text Supplier auto-creation support
    let finalSupplierId = data.supplierId || null;
    
    // Catch empty user types or missing forms completely
    if (finalSupplierId === "NEW" || finalSupplierId === "NEW:") {
       finalSupplierId = null;
    } else if (finalSupplierId && finalSupplierId.startsWith("NEW:")) {
       const newName = finalSupplierId.replace("NEW:", "").trim();
       if (newName) {
          try {
             const newSup = await prisma.supplier.create({ data: { name: newName, contactInfo: "" } });
             finalSupplierId = newSup.id;
          } catch (e) {
             // If exists, fetch it and use id
             const existing = await prisma.supplier.findFirst({ where: { name: newName } });
             if (existing) {
               console.log("[SERVER ACTION] Ya existía el supplier fallback:", existing.id);
               finalSupplierId = existing.id;
             }
          }
       }
    }

    console.log("[SERVER ACTION] FINAL SUPPLIER ID ANTES DE PRISMA EXPENSE:", finalSupplierId);

    const expense = await prisma.expense.create({
      data: {
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        baseAmount: data.baseAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        taxDeductible: data.taxDeductible,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(data.dueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        paymentStatus: data.paymentStatus,
        supplierId: finalSupplierId,
        treasuryAccountId: data.treasuryAccountId || null,
        documents: data.documents && data.documents.length > 0 ? {
          create: data.documents.map((doc: any) => ({
            name: doc.name,
            url: doc.url
          }))
        } : undefined,
        // Phase 3: Auto-create the initial obligation installment
        installments: {
          create: [{
            amount: data.totalAmount,
            expectedDate: data.dueDate ? new Date(data.dueDate) : new Date(),
            status: data.paymentStatus || "pending",
            paidDate: data.paidDate ? new Date(data.paidDate) : null,
            treasuryAccountId: data.treasuryAccountId || null,
            paymentMethod: "unknown" // Can be edited later
          }]
        }
      },
      include: { installments: true }
    });

    // If marked as paid immediately, extract from treasury and link it to the installment
    if (data.paymentStatus === "paid" && data.treasuryAccountId) {
      const installmentId = expense.installments[0]?.id;
      
      const movement = await prisma.treasuryMovement.create({
        data: {
          type: "outflow",
          sourceAccountId: data.treasuryAccountId,
          amount: data.totalAmount,
          description: `Pago Gasto: ${data.description}`,
          externalEntity: "Proveedor / Acreedor",
          date: data.paidDate ? new Date(data.paidDate) : new Date(),
          documents: data.documents && data.documents.length > 0 ? {
            create: data.documents.map((doc: any) => ({
              name: doc.name,
              url: doc.url
            }))
          } : undefined
        }
      });

      if (installmentId) {
         await prisma.paymentInstallment.update({
           where: { id: installmentId },
           data: { treasuryMovementId: movement.id }
         });
      }
    }

    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true, expense };
  } catch (error: any) {
    console.error("[SERVER ACTION] EXCEPCIÓN ALTA CREATE EXPENSE:", error);
    return { success: false, error: error.message || String(error) };
  }
}


export async function updateExpense(id: string, data: any) {
  try {
    // Prevent updating a "paid" expense to avoid treasury inconsistencies 
    const current = await prisma.expense.findUnique({ 
      where: { id },
      include: { installments: true }
    });
    if (!current) throw new Error("Gasto no encontrado");
    if (current.paymentStatus === "paid") {
      throw new Error("No se puede editar un gasto que ya está pagado directamente.");
    }

    // Phase 3 Enhancement: Free-text Supplier auto-creation support
    let finalSupplierId = data.supplierId || null;
    
    if (finalSupplierId === "NEW" || finalSupplierId === "NEW:") {
       finalSupplierId = null;
    } else if (finalSupplierId && finalSupplierId.startsWith("NEW:")) {
       const newName = finalSupplierId.replace("NEW:", "").trim();
       if (newName) {
          try {
             const newSup = await prisma.supplier.create({ data: { name: newName, contactInfo: "" } });
             finalSupplierId = newSup.id;
          } catch (e) {
             const existing = await prisma.supplier.findFirst({ where: { name: newName } });
             if (existing) finalSupplierId = existing.id;
          }
       }
    }

    // Update the expense (Obligation level)
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        baseAmount: data.baseAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        taxDeductible: data.taxDeductible,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        paymentStatus: data.paymentStatus,
        supplierId: finalSupplierId,
        treasuryAccountId: data.treasuryAccountId || null,
        // For documents we do a simple replacement strategy
        documents: {
          deleteMany: {}, // Delete old documents
          create: data.documents && data.documents.length > 0 ? data.documents.map((doc: any) => ({
            name: doc.name,
            url: doc.url
          })) : undefined
        }
      }
    });

    // Phase 3: We also need to update its underlying installment if it was still pending 
    // and this update changed the total or marked it as paid.
    // For now, assume it's a 1-to-1 sync if there's only 1 installment and it's pending.
    if (current.installments && current.installments.length === 1 && current.installments[0].status === "pending") {
       const instId = current.installments[0].id;
       await prisma.paymentInstallment.update({
         where: { id: instId },
         data: {
           amount: data.totalAmount,
           expectedDate: data.dueDate ? new Date(data.dueDate) : undefined,
           status: data.paymentStatus,
           paidDate: data.paidDate ? new Date(data.paidDate) : null,
           treasuryAccountId: data.treasuryAccountId || null
         }
       });

       // If marked as paid during this update, extract from treasury and link it
       if (data.paymentStatus === "paid" && data.treasuryAccountId) {
         const movement = await prisma.treasuryMovement.create({
           data: {
             type: "outflow",
             sourceAccountId: data.treasuryAccountId,
             amount: data.totalAmount,
             description: `Pago Gasto: ${data.description}`,
             externalEntity: "Proveedor / Acreedor",
             date: data.paidDate ? new Date(data.paidDate) : new Date(),
             documents: data.documents && data.documents.length > 0 ? {
               create: data.documents.map((doc: any) => ({
                 name: doc.name,
                 url: doc.url
               }))
             } : undefined
           }
         });
         await prisma.paymentInstallment.update({
           where: { id: instId },
           data: { treasuryMovementId: movement.id }
         });
       }
    } else if (current.installments && current.installments.length === 0) {
       // Legacy fallback: if it had no installments, we create one now bridging the gap
       const newInst = await prisma.paymentInstallment.create({
          data: {
            expenseId: expense.id,
            amount: data.totalAmount,
            expectedDate: data.dueDate ? new Date(data.dueDate) : new Date(),
            status: data.paymentStatus || "pending",
            paidDate: data.paidDate ? new Date(data.paidDate) : null,
            treasuryAccountId: data.treasuryAccountId || null,
            paymentMethod: "unknown"
          }
       });
       if (data.paymentStatus === "paid" && data.treasuryAccountId) {
         const movement = await prisma.treasuryMovement.create({
           data: {
             type: "outflow",
             sourceAccountId: data.treasuryAccountId,
             amount: data.totalAmount,
             description: `Pago Gasto: ${data.description}`,
             externalEntity: "Proveedor / Acreedor",
             date: data.paidDate ? new Date(data.paidDate) : new Date()
           }
         });
         await prisma.paymentInstallment.update({
           where: { id: newInst.id },
           data: { treasuryMovementId: movement.id }
         });
       }
    }

    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true, expense };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Payroll (Nóminas) ---
export async function createPayrollEntry(data: any) {
  try {
    const payroll = await prisma.payrollEntry.create({
      data: {
        date: new Date(data.date),
        employeeId: data.employeeId,
        amount: data.amount,
        type: data.type || "base_salary",
        note: data.note,
        status: data.status,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        documents: data.documents && data.documents.length > 0 ? {
          create: data.documents.map((doc: any) => ({
            name: doc.name,
            url: doc.url
          }))
        } : undefined
      }
    });

    // If paid, extract from treasury
    if (data.status === "paid" && data.treasuryAccountId) {
       await prisma.treasuryMovement.create({
        data: {
          type: "outflow",
          sourceAccountId: data.treasuryAccountId,
          amount: data.amount,
          description: `Pago Nómina: ${data.type}`,
          externalEntity: "Empleado",
          date: data.paidDate ? new Date(data.paidDate) : new Date(data.date),
          documents: data.documents && data.documents.length > 0 ? {
            create: data.documents.map((doc: any) => ({
              name: doc.name,
              url: doc.url
            }))
          } : undefined
        }
      });
    }

    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true, payroll };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Taxes (Impuestos a pagar) ---
export async function createTaxEntry(data: any) {
  try {
    const taxEntry = await prisma.taxEntry.create({
      data: {
        date: new Date(data.date),
        description: data.description,
        amount: data.amount,
        type: data.type, // 'pago' or 'reserva'
        documents: data.documents && data.documents.length > 0 ? {
          create: data.documents.map((doc: any) => ({
            name: doc.name,
            url: doc.url
          }))
        } : undefined
      }
    });

    // If it's a direct payment to Hacienda
    if (data.type === "pago" && data.treasuryAccountId) {
       await prisma.treasuryMovement.create({
        data: {
          type: "outflow",
          sourceAccountId: data.treasuryAccountId,
          amount: data.amount,
          description: `Pago Impuesto: ${data.description}`,
          externalEntity: "Hacienda",
          date: new Date(data.date),
          documents: data.documents && data.documents.length > 0 ? {
            create: data.documents.map((doc: any) => ({
              name: doc.name,
              url: doc.url
            }))
          } : undefined
        }
      });
    }
    // If it's a 'reserva', the user should use InternalTransfer Modal in Treasury (Bank -> Reserve)
    
    revalidatePath("/expenses");
    revalidatePath("/treasury");
    return { success: true, taxEntry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
