const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const downloadsDir = "C:\\Users\\Juan\\Downloads";

function testProductsExcel() {
  const files = fs.readdirSync(downloadsDir);
  const prodFiles = files.filter(f => f.toLowerCase().includes("producto") && f.endsWith(".xlsx"));
  
  if (prodFiles.length === 0) {
    console.log("No se encontraron exceles de productos en Downloads.");
    return;
  }

  // Coger el más reciente
  const target = path.join(downloadsDir, prodFiles[0]);
  console.log("Analizando archivo:", target);

  const buffer = fs.readFileSync(target);
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];
  
  // Imprimir raw sin extraer a JSON primero
  const dataArrays = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log("\nRAW Excel Arrays (Primeras 5 filas):");
  for(let i=0; i<5 && i<dataArrays.length; i++) {
    console.log(`Fila ${i}:`, dataArrays[i]);
  }

  // Extraer como JSON (lo que hace nuestra app)
  const dataJson = xlsx.utils.sheet_to_json(ws);
  console.log("\nJSON Extract (Primeras 2 filas estructuradas):");
  for(let i=0; i<2 && i<dataJson.length; i++) {
    console.log(`Fila ${i}:`, dataJson[i]);
  }
}

testProductsExcel();
