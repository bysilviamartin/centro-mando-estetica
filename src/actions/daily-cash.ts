"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Calculates daily sales and movements directly from the Koibox source tables.
 * Returns both the calculated totals from Imports and the saved DailyCash (if it exists).
 */
export async function getDailyCashData(dateStr: string) {
  try {
    // 1. Boundary definitions for SQL Day
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    // Normalize string key to exactly YYYY-MM-DDT00:00:00.000Z for Prisma DailyCash unique key
    const normalizedDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

    // 2. Query ImportedSales for the specific day
    const sales = await prisma.importedSale.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    // 3. Query ImportedMovements for the specific day
    const movements = await prisma.importedMovement.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        type: "ingreso" // Only look at inflows (revenue) for cash/card tally, not outflows
      }
    });

    // 4. Calculate Sales Tally (treatmentSales, productSales, voucherSales, giftCardSales, otherSales)
    let treatmentSales = 0;
    let productSales = 0;
    let voucherSales = 0;
    let giftCardSales = 0;
    let otherSales = 0;

    for (const sale of sales) {
      const amt = Number(sale.totalAmount) || 0;
      switch (sale.classifiedType) {
        case "service": treatmentSales += amt; break;
        case "product": productSales += amt; break;
        case "voucher": voucherSales += amt; break;
        case "gift_card": giftCardSales += amt; break;
        default: otherSales += amt; break;
      }
    }

    // 5. Calculate Revenue Forms from Movements (cashAmount, cardAmount, transferAmount, bizumAmount)
    let cashAmount = 0;
    let cardAmount = 0;
    let transferAmount = 0;
    let bizumAmount = 0;

    for (const mov of movements) {
      const amt = Number(mov.amount) || 0;
      const method = mov.paymentMethod?.toLowerCase() || "";
      
      if (method.includes("efectivo") || method.includes("cash")) cashAmount += amt;
      else if (method.includes("tarjeta") || method.includes("card")) cardAmount += amt;
      else if (method.includes("transferencia") || method.includes("bank")) transferAmount += amt;
      else if (method.includes("bizum")) bizumAmount += amt;
      else cashAmount += amt; // default to cash if unknown, or maybe other. Let's say cash for safety.
    }

    // 6. Check if DailyCash record already exists for this date
    const existingDailyCash = await prisma.dailyCash.findUnique({
      where: { date: normalizedDate }
    });

    return {
      success: true,
      data: {
        calculated: {
          treatmentSales,
          productSales,
          voucherSales,
          giftCardSales,
          otherSales,
          cashAmount,
          cardAmount,
          transferAmount,
          bizumAmount
        },
        saved: existingDailyCash
      }
    };

  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching daily cash:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Upserts the DailyCash record for a given day.
 */
export async function saveDailyCashData(dateStr: string, payload: any) {
  try {
    const targetDate = new Date(dateStr);
    const normalizedDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

    const dataObj = {
      treatmentSales: payload.treatmentSales,
      productSales: payload.productSales,
      voucherSales: payload.voucherSales,
      giftCardSales: payload.giftCardSales,
      otherSales: payload.otherSales,
      cashAmount: payload.cashAmount,
      cardAmount: payload.cardAmount,
      transferAmount: payload.transferAmount,
      bizumAmount: payload.bizumAmount,
      volveremosCashAmount: payload.volveremosCashAmount,
      volveremosCardAmount: payload.volveremosCardAmount,
      notes: payload.notes || ""
    };

    const saved = await prisma.dailyCash.upsert({
      where: { date: normalizedDate },
      update: dataObj,
      create: {
        date: normalizedDate,
        ...dataObj
      }
    });

    revalidatePath("/caja-diaria");
    return { success: true, data: saved };

  } catch (error: any) {
    console.error("[SERVER ACTION] Error saving daily cash:", error);
    return { success: false, error: error.message };
  }
}
