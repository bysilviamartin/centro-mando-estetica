// @ts-nocheck
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processImport(
  data: any[],
  filename: string,
  fileType: "ventas" | "movimientos" = "movimientos"
) {
  try {
    // 1. Create import session
    const session = await prisma.importSession.create({
      data: {
        filename,
        fileType,
        status: "processing",
        rowsProcessed: 0,
        rowsIgnored: 0,
      },
    });

    const rules = await prisma.classificationRule.findMany();

    if (fileType === "ventas") {
      // ----------------------------------------------------
      // PIPELINE A: VENTAS
      // ----------------------------------------------------
      const sheet0 = data.sheet0 as any[][];
      const sheet1 = data.sheet1 as any[][];
      const sheet2 = data.sheet2 as any[][];
      let rowsIgnored = 0;
      const sales: any[] = [];

      // SAFE DATE KEY EXTRACTOR (Avoys UTC offset bugs causing dates to jump 1 day back)
      const safeDateKey = (raw: any) => {
        if (!raw) return "no-date";
        const d = raw instanceof Date ? raw : new Date(raw);
        if (isNaN(d.getTime())) return "no-date";
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      };

      // SAFE NUMBER EXTRACTOR (1.500,20 -> 1500.20)
      const safeNum = (val: any, fallback = 0) => {
        if (val === undefined || val === null || val === "") return fallback;
        if (typeof val === "number") return val;
        let str = String(val).trim();
        // Remove periods used as thousands separators if there's a comma for decimals
        if (str.includes(",") && str.includes(".")) {
           // 1.500,20 format
           str = str.replace(/\./g, "").replace(",", ".");
        } else if (str.includes(",")) {
           // 20,50 format
           str = str.replace(",", ".");
        }
        const n = parseFloat(str);
        return isNaN(n) ? fallback : n;
      };

      // ----------------------------------------------------
      // HOJA 1: GENERAL (Products, Services, Workers)
      // ----------------------------------------------------
      // DUPLICITY CONTROL (Ticket + Fecha)
      const incomingTickets = new Set<string>();
      
      for (let i = 0; i < sheet0.length; i++) {
        if (sheet0[i] && sheet0[i][1]) incomingTickets.add(String(sheet0[i][1]).trim());
      }
      for (let i = 0; i < sheet2.length; i++) {
        if (sheet2[i] && sheet2[i][1]) incomingTickets.add(String(sheet2[i][1]).trim());
      }

      const existingSales = await prisma.importedSale.findMany({
        where: { ticketNumber: { in: Array.from(incomingTickets) } },
        select: { ticketNumber: true, date: true }
      });

      const existingKeys = new Set(
        existingSales.map(s => `${s.ticketNumber}_${safeDateKey(s.date)}`)
      );

      for (let i = 0; i < sheet0.length; i++) {
        const row = sheet0[i];
        if (!row || !Array.isArray(row)) continue;

        const conceptRaw = row[7];
        const totalRaw = row[16];
        if (conceptRaw === undefined || conceptRaw === null || String(conceptRaw).trim() === "") {
           rowsIgnored++;
           continue;
        }
        
        if (totalRaw === undefined || totalRaw === null || String(totalRaw).trim() === "") {
           rowsIgnored++;
           continue;
        }

        const desc = String(conceptRaw).trim();
        const descLower = desc.toLowerCase();
        if (descLower.includes("total ticket") || descLower === "totales") {
           rowsIgnored++;
           continue;
        }

        const totalAmount = safeNum(totalRaw, NaN);
        if (isNaN(totalAmount)) {
           rowsIgnored++;
           continue;
        }

        const dateRaw = row[0];
        const date = dateRaw instanceof Date ? dateRaw : new Date(dateRaw || Date.now());
        const rawTicket = row[1] ? String(row[1]).trim() : "SIN TICKET";
        
        // --- DUPLICITY CHECK ---
        const dateKeyCheck = safeDateKey(date);
        if (rawTicket !== "SIN TICKET" && existingKeys.has(`${rawTicket}_${dateKeyCheck}`)) {
           rowsIgnored++;
           continue;
        }

        const employee = row[6] ? String(row[6]).trim() : null;
        const ref = row[9] ? String(row[9]).trim() : null;
        
        let qty = safeNum(row[11], 1);
        if (qty <= 0) qty = 1;

        let classifiedType = "unknown";
        let classificationStatus = "pending_review";
        let fiscalRuleType = "unknown";
        let countsAsRevenue = false;
        let generatesVat = false;
        let vatAlreadyRecognized = false;

        for (const rule of rules) {
          if (descLower.includes(rule.keyword.toLowerCase())) {
            classifiedType = rule.targetType;
            classificationStatus = "classified";
            fiscalRuleType = rule.targetFiscalRule;
            
            switch (fiscalRuleType) {
              case "normal_taxable_sale": countsAsRevenue = true; generatesVat = true; break;
              case "prepaid_voucher_sale": countsAsRevenue = true; generatesVat = true; break;
              case "voucher_session_consumption": countsAsRevenue = false; generatesVat = false; vatAlreadyRecognized = true; break;
              case "debt_payment": countsAsRevenue = false; generatesVat = false; break;
              case "gift_card_sale": countsAsRevenue = true; generatesVat = false; break;
              case "gift_card_redemption": countsAsRevenue = false; generatesVat = true; break;
              case "adjustment": countsAsRevenue = false; generatesVat = false; break;
              default: break;
            }
            break;
          }
        }

        sales.push({
          importSessionId: session.id,
          ticketNumber: rawTicket,
          date: date,
          description: desc,
          quantity: qty,
          baseAmount: 0,
          taxAmount: 0,
          totalAmount: totalAmount,
          employeeName: employee,
          reference: ref,
          category: null,
          classifiedType,
          classifiedEntityId: null,
          classificationStatus,
          fiscalRuleType,
          countsAsRevenue,
          generatesVat,
          vatAlreadyRecognized,
        });
      }

      await prisma.$transaction(async (tx) => {
        for (const sale of sales) {
          // @ts-ignore
          await tx.importedSale.create({ data: sale });
        }

        // HOJA 1: PRODUCTOS
        const references = sales.map(s => s.reference).filter(Boolean) as string[];
        const uniqueRefs = [...new Set(references)];
        
        if (uniqueRefs.length > 0) {
          // @ts-ignore
          const productsInSales = await tx.product.findMany({
            where: { reference: { in: uniqueRefs } }
          });
          
          if (productsInSales.length > 0) {
            const qtyByRef: Record<string, number> = {};
            for (const s of sales) {
              if (s.reference) qtyByRef[s.reference] = (qtyByRef[s.reference] || 0) + (s.quantity || 1);
            }
            
            for (const p of productsInSales) {
              const qtySold = qtyByRef[p.reference as string] || 0;
              if (qtySold > 0) {
                // @ts-ignore
                await tx.product.update({
                  where: { id: p.id },
                  data: {
                    stock: p.stock - qtySold,
                    stockMovements: {
                      create: {
                        type: "sale",
                        quantity: -qtySold,
                        description: `Ventas importadas Hoja 1 (${filename})`
                      }
                    }
                  }
                });
              }
            }
          }
        }

        // ----------------------------------------------------
        // HOJA 2: POR EMPLEADO
        // ----------------------------------------------------
        for (let i = 0; i < sheet1.length; i++) {
          const row = sheet1[i];
          if (!row || !Array.isArray(row)) continue;
          
          const concepto = row[7];
          const total = row[16];
          if (concepto === undefined || concepto === null || String(concepto).trim() === "") continue;
          if (total === undefined || total === null || String(total).trim() === "") continue;
          
          const desc = String(concepto).toLowerCase();
          if (desc === "totales" || desc.includes("total ticket")) continue;
          
          // Por normativa expresa del usuario, NO persisitimos clientes en BD en esta tarea.
          // La hoja se mapeará formalmente cuando se construya el sistema de Clientes.
        }

        // ----------------------------------------------------
        // HOJA 3: SIN DESGLOSAR (Caja, Impuestos, Tesorería)
        // ----------------------------------------------------
        const dailyCashAgg: Record<string, { cash: number, card: number, bizum: number, transfer: number, total: number }> = {};

        for (let i = 0; i < sheet2.length; i++) {
          const row = sheet2[i];
          if (!row || !Array.isArray(row)) continue;

          const ticketRaw = row[1];
          const dateRaw = row[0];
          const subtotalRaw = row[7];
          const cuotaRaw = row[8];
          const totalRaw = row[9];
          const methodRaw = String(row[10] || "Efectivo").trim().toLowerCase();

          if (!ticketRaw) continue;
          if (totalRaw === undefined || totalRaw === null || String(totalRaw).trim() === "") continue;

          const ticket = String(ticketRaw).trim();
          if (ticket.toLowerCase() === "totales" || ticket.toLowerCase().includes("total ticket")) continue;

          const total = safeNum(totalRaw, NaN);
          if (isNaN(total)) continue;

          const subtotal = safeNum(subtotalRaw, 0);
          const cuota = safeNum(cuotaRaw, 0);

          const date = dateRaw instanceof Date ? dateRaw : new Date(dateRaw || Date.now());
          const dateKey = safeDateKey(date); 

          // --- DUPLICITY CHECK ---
          if (existingKeys.has(`${ticket}_${dateKey}`)) {
             continue;
          }

          if (!dailyCashAgg[dateKey]) dailyCashAgg[dateKey] = { cash: 0, card: 0, bizum: 0, transfer: 0, total: 0 };
          dailyCashAgg[dateKey].total += total;

          if (methodRaw.includes("efectivo")) dailyCashAgg[dateKey].cash += total;
          else if (methodRaw.includes("tarjeta")) dailyCashAgg[dateKey].card += total;
          else if (methodRaw.includes("bizum")) dailyCashAgg[dateKey].bizum += total;
          else if (methodRaw.includes("transferencia")) dailyCashAgg[dateKey].transfer += total;
          else dailyCashAgg[dateKey].cash += total; // Fallback efectivo

          if (!isNaN(subtotal) && !isNaN(cuota)) {
             // @ts-ignore
             await tx.taxEntry.create({
               data: {
                 date: date,
                 description: `Impuestos Factura ${ticket} (Importación)`,
                 amount: cuota,
                 type: "reserve"
               }
             });
          }

          // @ts-ignore
          await tx.treasuryMovement.create({
             data: {
                date: date,
                description: `Importación Factura ${ticket} (${row[10] || 'Efectivo'})`,
                amount: total,
                type: "inflow",
                externalEntity: "Cliente",
                isAdjustment: false
             }
          });
        }

        // CAJA
        for (const [dKey, agg] of Object.entries(dailyCashAgg)) {
           const d = new Date(dKey);
           // @ts-ignore
           const existing = await tx.dailyCash.findUnique({ where: { date: d } });
           if (existing) {
             // @ts-ignore
             await tx.dailyCash.update({
               where: { id: existing.id },
               data: {
                 treatmentSales: Number(existing.treatmentSales) + agg.total, // Asumiendo consolidacion en tratamiento
                 cashAmount: Number(existing.cashAmount) + agg.cash,
                 cardAmount: Number(existing.cardAmount) + agg.card,
                 bizumAmount: Number(existing.bizumAmount) + agg.bizum,
                 transferAmount: Number(existing.transferAmount) + agg.transfer
               }
             });
           } else {
             // @ts-ignore
             await tx.dailyCash.create({
               data: {
                 date: d,
                 treatmentSales: agg.total,
                 cashAmount: agg.cash,
                 cardAmount: agg.card,
                 bizumAmount: agg.bizum,
                 transferAmount: agg.transfer
               }
             });
           }
        }
      });

      const validSalesCount = sales.length;

      await prisma.importSession.update({
        where: { id: session.id },
        data: { status: "success", rowsProcessed: validSalesCount, rowsIgnored },
      });
      
      revalidatePath("/import");
      revalidatePath("/review");
      revalidatePath("/cash");
      revalidatePath("/treasury");
      return { success: true, count: validSalesCount, ignored: rowsIgnored };

    } else if (fileType === "movimientos") {
      // ----------------------------------------------------
      // PIPELINE B: MOVIMIENTOS (Cash Reconciliation)
      // ----------------------------------------------------
      const movements = data.map((row) => {
        // Normalization helpers
        const amount = parseFloat(row["Importe"]?.toString().replace(",", ".") || "0");
        const saleAmount = parseFloat(row["Importe venta"]?.toString().replace(",", ".") || "0");
        const saleTax = parseFloat(row["Imp. Iva"]?.toString().replace(",", ".") || "0");
        
        const rawDate = row["Fecha"] ? new Date(row["Fecha"]) : new Date();
        const rawType = row["Tipo"] || "ingreso";
        const desc = row["Descripción"] || "Sin Descripción";
        const method = row["Forma Pago"] || "";
        const employee = row["Empleado"] || null;

        return {
          importSessionId: session.id,
          date: rawDate,
          type: rawType,
          description: desc,
          amount,
          saleAmount: saleAmount, 
          saleTax: saleTax,
          paymentMethod: method,
          employeeName: employee,
          
          classifiedType: "unknown",
          classificationStatus: "ignored", // Movimientos are not classified in Phase 2.4 pivot
          fiscalRuleType: "unknown",
          countsAsRevenue: false,
          generatesVat: false,
          vatAlreadyRecognized: false,
        };
      });

      await prisma.$transaction(
        movements.map(mov => prisma.importedMovement.create({ data: mov }))
      );
      // Update rowsProcessed
      const validRowsCount = movements.length; // All movements are considered valid for now
      await prisma.importSession.update({
        where: { id: session.id },
        data: { status: "success", rowsProcessed: validRowsCount, rowsIgnored: 0 },
      });

      revalidatePath("/import");
      revalidatePath("/tesoreria");
    }

    return { success: true };
  } catch (error: any) {
    console.error("[processImport] Error:", error);
    return { success: false, error: error.message };
  }
}
