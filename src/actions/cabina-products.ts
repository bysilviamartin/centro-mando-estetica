// @ts-nocheck
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCabinaProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { internalUse: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: products };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching cabina products:", error);
    return { success: false, error: error.message };
  }
}

export async function getCabinaProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { date: "desc" },
          take: 10
        }
      }
    });
    if (!product || !product.internalUse) return { success: false, error: "Producto cabina no encontrado." };
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching cabina product:", error);
    return { success: false, error: error.message };
  }
}

export async function createCabinaProduct(data: any) {
  try {
    const stockVal = data.stock ? parseInt(data.stock, 10) : 0;
    
    let finalRef = data.reference || null;
    if (finalRef && !finalRef.toUpperCase().endsWith("-CAB")) finalRef = `${finalRef}-CAB`;
    
    let finalName = data.name;
    if (finalName && !finalName.toLowerCase().includes("cabina")) finalName = `${finalName} (Cabina)`;

    const product = await prisma.product.create({
      data: {
        reference: finalRef,
        name: finalName,
        capacity: data.capacity || null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : 0,
        vat: data.vat ? parseFloat(data.vat) : 21.0,
        salePrice: 0,
        stock: stockVal,
        supplier: data.supplier || null,
        internalUse: true,
        active: true
      }
    });

    if (stockVal > 0) {
      await prisma.productStockMovement.create({
        data: {
          productId: product.id,
          type: "import_initial",
          quantity: stockVal,
          description: "Stock inicial cabina"
        }
      });
    }

    revalidatePath("/settings/products/cabina");
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error creating cabina product:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCabinaProduct(id: string, data: any) {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || !existing.internalUse) throw new Error("Producto no válido");

    let finalName = data.name !== undefined ? data.name : existing.name;
    if (finalName && !finalName.toLowerCase().includes("cabina")) finalName = `${finalName} (Cabina)`;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: finalName,
        capacity: data.capacity !== undefined ? data.capacity : existing.capacity,
        costPrice: data.costPrice !== undefined ? parseFloat(data.costPrice) : existing.costPrice,
        vat: data.vat !== undefined ? parseFloat(data.vat) : existing.vat,
        supplier: data.supplier !== undefined ? data.supplier : existing.supplier,
      }
    });
    revalidatePath("/settings/products/cabina");
    revalidatePath(`/settings/products/cabina/${id}`);
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error updating cabina product:", error);
    return { success: false, error: error.message };
  }
}

export async function adjustCabinaStock(productId: string, quantity: number, description: string) {
  try {
    if (quantity === 0) return { success: false, error: "La cantidad no puede ser 0" };

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.internalUse) return { success: false, error: "Producto no encontrado" };

    const newStock = product.stock + quantity;
    if (newStock < 0) return { success: false, error: "El stock no puede ser negativo" };

    await prisma.$transaction(async (tx) => {
      await tx.productStockMovement.create({
        data: {
          productId,
          type: "manual_adjustment",
          quantity,
          description: description || (quantity > 0 ? "Ajuste manual (entrada)" : "Ajuste manual (salida)")
        }
      });
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });
    });

    revalidatePath("/settings/products/cabina");
    revalidatePath(`/settings/products/cabina/${productId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error adjusting cabina stock:", error);
    return { success: false, error: error.message };
  }
}

export async function importCabinaProductsFromExcel(sheets: { name: string, index: number, data: any[][] }[]) {
  try {
    let processed = 0;
    let updated = 0;
    let created = 0;
    let ignored = 0;

    for (const sheet of sheets) {
      const cleanName = sheet.name.trim().toLowerCase();
      
      const isSkinIdent = cleanName === "skinident cabina" || cleanName.includes("skinident");
      const isBaumann = cleanName === "dr. baumann cabina" || cleanName.includes("baumann");

      if (sheet.index !== 1 && sheet.index !== 3) continue; // Posición no esperada

      let supplierValue = "";
      if (sheet.index === 1 && isSkinIdent) {
        supplierValue = "SkinIdent Cabina";
      } else if (sheet.index === 3 && isBaumann) {
        supplierValue = "Dr. Baumann Cabina";
      } else {
        throw new Error(`La hoja en la posición ${sheet.index + 1} (${sheet.name}) no concuerda con la cabina esperada.`);
      }

      for (let i = 0; i < sheet.data.length; i++) {
         const row = sheet.data[i];
         if (!row || !Array.isArray(row)) continue;

         const nameRaw = row[0];
         const refRaw = row[2];
         const capRaw = row[3];
         const priceRaw = row[4];

         if (!nameRaw || !refRaw || !capRaw || priceRaw === undefined || priceRaw === null || String(priceRaw).trim() === "") {
            ignored++;
            continue;
         }

         const name = String(nameRaw).trim();
         const reference = String(refRaw).trim();
         const capacity = String(capRaw).trim();
         
         const finalRef = reference ? (reference.toUpperCase().endsWith("-CAB") ? reference : `${reference}-CAB`) : null;
         const finalName = name.toLowerCase().includes("cabina") ? name : `${name} (Cabina)`;
         
         let costPrice = 0;
         if (typeof priceRaw === "number") {
           costPrice = priceRaw;
         } else {
           let priceStr = String(priceRaw).trim();
           if (priceStr.includes(",") && priceStr.includes(".")) {
              priceStr = priceStr.replace(/\./g, "").replace(",", ".");
           } else if (priceStr.includes(",")) {
              priceStr = priceStr.replace(",", ".");
           }
           const p = parseFloat(priceStr);
           if (!isNaN(p)) costPrice = p;
         }

         // Search exact by CAB reference so we don't accidentally overwrite or collide with Ventas.
         const existing = finalRef ? await prisma.product.findUnique({
           where: { reference: finalRef }
         }) : null;

         if (existing) {
           await prisma.product.update({
             where: { id: existing.id },
             data: {
               name: finalName,
               capacity,
               costPrice,
               supplier: supplierValue,
               internalUse: true
             }
           });
           updated++;
         } else {
           await prisma.product.create({
             data: {
               reference: finalRef,
               name: finalName,
               capacity,
               costPrice,
               vat: 21.0,
               salePrice: 0,
               stock: 0,
               supplier: supplierValue,
               internalUse: true,
               active: true
             }
           });
           created++;
         }
         processed++;
      }
    }

    revalidatePath("/settings/products/cabina");
    return { success: true, processed, created, updated, ignored };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error importing cabina products:", error);
    return { success: false, error: error.message };
  }
}
