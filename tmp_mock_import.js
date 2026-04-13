const { importProductsFromExcel } = require('./.next/server/app/settings/products/page.js') || {};

// Since NextJS actions are compiled, let's just make a script that uses prisma directly identically to the action.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const data = [
    {
      "Referencia": "TEST01",
      "Producto": "Crema Facial Test",
      "Stock": 10,
      "Coste": 5,
      "PVP": 20
    }
  ];

  let rowsProcessed = 0;
  let rowsIgnored = 0;

  const getValue = (row, possibleKeys) => {
    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
      const matchedKey = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (matchedKey) return row[matchedKey];
    }
    return null;
  };

  for (const row of data) {
    const reference = (getValue(row, ["Referencia", "Ref", "ID"]) || "").toString().trim() || null;
    const rawName = (getValue(row, ["Producto", "Nombre", "Artículo", "Articulo"]) || "").toString().trim();
    
    if (!rawName) {
      rowsIgnored++;
      continue;
    }

    let costPrice = parseFloat((getValue(row, ["Precio Coste", "Coste", "Precio Compra"]) || "0").toString().replace(",", "."));
    let salePrice = parseFloat((getValue(row, ["Precio Venta", "PVP", "Precio"]) || "0").toString().replace(",", "."));
    let stockRaw = parseInt((getValue(row, ["Stock", "Cantidad"]) || "0").toString(), 10) || 0;
    
    if (isNaN(costPrice)) costPrice = 0;
    if (isNaN(salePrice)) salePrice = 0;
    if (isNaN(stockRaw)) stockRaw = 0;

    const minimumStock = 0;
    const supplier = null;
    const minimumOrder = 1;
    const internalUse = false; 
    const activeRaw = (getValue(row, ["Activo", "Estado"]) || "").toString().toLowerCase();
    const active = activeRaw !== "no" && activeRaw !== "false";

    let extractedName = rawName;
    let line = null;
    let capacity = null;

    try {
      await prisma.$transaction(async (tx) => {
        let prod = null;
        if (reference) {
          prod = await tx.product.findUnique({ where: { reference } });
        }

        if (prod) {
          // update
        } else {
          try {
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
          } catch (err) {
            console.error("FAIL INNER CREATE:", err);
            throw err;
          }
        }
      });
      rowsProcessed++;
    } catch (gErr) {
      console.error("FAIL TX:", gErr);
    }
  }

  console.log("Processed:", rowsProcessed, "Ignored:", rowsIgnored);
  const check = await prisma.product.findMany();
  console.log("DB count:", check.length);
}

run().catch(console.error).finally(() => prisma.$disconnect());
