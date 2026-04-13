// @ts-nocheck
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    // @ts-ignore
    const products = await prisma.product.findMany({
      where: { internalUse: false },
      orderBy: { name: "asc" }
    });
    return { success: true, data: products };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching products:", error);
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    // @ts-ignore
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { date: "desc" },
          take: 10
        }
      }
    });
    if (!product) return { success: false, error: "Producto no encontrado." };
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching product:", error);
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    // @ts-ignore
    const product = await prisma.product.create({
      data: {
        reference: data.reference || null,
        name: data.name,
        line: data.line || null,
        capacity: data.capacity || null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : 0,
        vat: data.vat ? parseFloat(data.vat) : 21,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : 0,
        stock: data.stock ? parseInt(data.stock, 10) : 0,
        minimumStock: data.minimumStock ? parseInt(data.minimumStock, 10) : 0,
        supplier: data.supplier || null,
        active: data.active !== undefined ? data.active : true,
        stockMovements: data.stock ? {
          create: [{
            type: "initial_creation",
            quantity: parseInt(data.stock, 10),
            description: "Creacion inicial de producto con stock."
          }]
        } : undefined
      }
    });
    
    revalidatePath("/settings");
    revalidatePath("/settings/products");
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error creating product:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    // @ts-ignore
    const product = await prisma.product.update({
      where: { id },
      data: {
        reference: data.reference,
        name: data.name,
        line: data.line,
        capacity: data.capacity,
        costPrice: data.costPrice,
        vat: data.vat,
        salePrice: data.salePrice,
        minimumStock: data.minimumStock,
        supplier: data.supplier,
        active: data.active
      }
    });
    
    revalidatePath(`/settings/products/${id}`);
    revalidatePath("/settings/products");
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error updating product:", error);
    return { success: false, error: error.message };
  }
}

export async function adjustProductStock(id: string, adjustment: number, description: string = "Ajuste manual") {
  try {
    if (adjustment === 0) return { success: false, error: "El ajuste no puede ser cero." };

    // @ts-ignore
    const product = await prisma.$transaction(async (tx) => {
      // @ts-ignore
      const prod = await tx.product.findUnique({ where: { id } });
      if (!prod) throw new Error("Producto no encontrado");

      // @ts-ignore
      const updated = await tx.product.update({
        where: { id },
        data: {
          stock: prod.stock + adjustment,
          stockMovements: {
            create: {
              type: "manual_adjustment",
              quantity: adjustment,
              description
            }
          }
        },
        include: {
          stockMovements: {
            orderBy: { date: "desc" },
            take: 10
          }
        }
      });
      return updated;
    });

    revalidatePath(`/settings/products/${id}`);
    revalidatePath("/settings/products");
    return { success: true, data: product };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error adjusting stock:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Check if it has movements
    // @ts-ignore
    const prod = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: true
      }
    });

    if (!prod) return { success: false, error: "Producto no encontrado." };

    if (prod.stockMovements && prod.stockMovements.length > 1) {
       // Allow delete only if it's just the initial creation
       // Actually, safely we just try to delete, if it fails, throw.
       // But Prisma throws P2003 for foreign keys. We can manually check:
       if (prod.stockMovements.length > 0) {
         return { success: false, error: "No se puede eliminar un producto con historial de movimientos. Por favor, desactívalo desde su ficha." };
       }
    }

    // @ts-ignore
    await prisma.product.delete({
      where: { id }
    });

    revalidatePath("/settings/products");
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error deleting product:", error);
    if (error.code === 'P2003') {
      return { success: false, error: "Existen registros (ventas, stock) vinculados a este producto. No se puede eliminar, se recomienda desactivarlo." };
    }
    return { success: false, error: error.message };
  }
}

export async function importProductsFromExcel(data: any[]) {
  try {
    let rowsCreated = 0;
    let rowsUpdated = 0;
    let rowsIgnored = 0;
    let ignoredReason = "Sin nombre o producto válido";

    console.log("[DEBUG IMPORT] Total rows leídas de Excel:", data.length);
    let rowsIteradas = 0;

    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;
      rowsIteradas++;

      if (rowsIteradas === 1) {
        console.log("[DEBUG IMPORT] Primera fila útil leída (índice 3):", row);
      }

      const rawName = (row[2] || "").toString().trim();
      
      if (!rawName) {
        console.log(`[DEBUG IMPORT] FILA ${i+1} IGNORADA POR FALTA DE NOMBRE/PRODUCTO (Columna 2):`, row);
        rowsIgnored++;
        continue;
      }

      const reference = (row[1] || "").toString().trim() || null;
      let costPrice = parseFloat((row[3] || "0").toString().replace(",", "."));
      let salePrice = parseFloat((row[4] || "0").toString().replace(",", "."));
      const lineRaw = (row[5] || "").toString().trim() || null;
      let stockRaw = parseInt((row[6] || "0").toString(), 10) || 0;
      let minimumStock = parseInt((row[7] || "0").toString(), 10) || 0;
      const supplier = (row[8] || "").toString().trim() || null;
      let minimumOrder = parseInt((row[9] || "1").toString(), 10) || 1;
      
      if (isNaN(costPrice)) costPrice = 0;
      if (isNaN(salePrice)) salePrice = 0;
      if (isNaN(stockRaw)) stockRaw = 0;
      if (isNaN(minimumStock)) minimumStock = 0;
      if (isNaN(minimumOrder)) minimumOrder = 1;
      
      const internalUseStr = (row[13] || "").toString().toLowerCase();
      const internalUse = internalUseStr === "si" || internalUseStr === "sí" || internalUseStr === "true" || internalUseStr === "1";
      
      const activeStr = (row[14] || "").toString().toLowerCase();
      const active = activeStr !== "no" && activeStr !== "false" && activeStr !== "0";

      let extractedName = rawName;
      let line = lineRaw;
      let capacity = null;

      const parts = rawName.split('|').map((p: string) => p.trim());
      if (parts.length >= 3) {
        if (!line) line = parts[1];
        const trailingPart = parts[parts.length - 1].toLowerCase();
        if (trailingPart.match(/\d+\s*(ml|g|l|oz|kg)/i)) {
          capacity = parts[parts.length - 1];
          extractedName = parts.slice(2, -1).join(" | ");
        } else {
          extractedName = parts.slice(2).join(" | ");
        }
      }

      // @ts-ignore
      await prisma.$transaction(async (tx) => {
        let prod = null;
        if (reference) {
          // @ts-ignore
          prod = await tx.product.findUnique({ where: { reference } });
        }

        if (prod) {
          const diff = stockRaw - prod.stock;
          // @ts-ignore
          await tx.product.update({
            where: { id: prod.id },
            data: {
              name: rawName,
              line: line || prod.line,
              capacity: capacity || prod.capacity,
              stock: stockRaw,
              costPrice,
              salePrice,
              minimumStock,
              supplier,
              minimumOrder,
              internalUse,  // always false here
              active,
              ...(diff !== 0 && {
                stockMovements: {
                  create: {
                    type: "restock_import",
                    quantity: diff,
                    description: `Importación Koibox: ajustado a ${stockRaw}`
                  }
                }
              })
            }
          });
          rowsUpdated++;
        } else {
          try {
            // @ts-ignore
            await tx.product.create({
              data: {
                reference,
                name: rawName,
                line,
                capacity,
                costPrice,
                vat: 21.0,
                salePrice,
                stock: stockRaw,
                minimumStock,
                supplier,
                minimumOrder,
                internalUse,
                active,
                stockMovements: {
                  create: {
                    type: "import_initial",
                    quantity: stockRaw,
                    description: "Importación inicial Koibox"
                  }
                }
              }
            });
            rowsCreated++;
          } catch (err: any) {
            if (err.code === "P2002") {
               // @ts-ignore
               let existingByName = await tx.product.findUnique({ where: { name: rawName } });
               if(existingByName) {
                 const diff2 = stockRaw - existingByName.stock;
                 // @ts-ignore
                 await tx.product.update({
                    where: { id: existingByName.id },
                    data: {
                      reference: reference, 
                      stock: stockRaw,
                      costPrice, salePrice,
                      ...(diff2 !== 0 && {
                        stockMovements: {
                          create: {
                            type: "restock_import",
                            quantity: diff2,
                            description: `Importación automática (Por nombre): ajustado a ${stockRaw}`
                          }
                        }
                      })
                    }
                 });
                 rowsUpdated++;
               }
            } else {
              throw err;
            }
          }
        }
      });
    }

    console.log("[DEBUG IMPORT] FIN IMPORTACIÓN");
    console.log("[DEBUG IMPORT] Total rows iteradas:", rowsIteradas);
    console.log("[DEBUG IMPORT] Total creados:", rowsCreated);
    console.log("[DEBUG IMPORT] Total actualizados:", rowsUpdated);
    console.log("[DEBUG IMPORT] Total ignorados:", rowsIgnored);

    revalidatePath("/settings");
    revalidatePath("/settings/products");
    return { success: true, rowsCreated, rowsUpdated, rowsIgnored, ignoredReason };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error importing products:", error);
    return { success: false, error: error.message };
  }
}
