import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";

function mapKoiboxHeadersToSchema(rawRow: any) {
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      if (rawRow[k] !== undefined && rawRow[k] !== null && rawRow[k] !== "") return rawRow[k];
    }
    return null;
  };

  return {
    reference: getVal(["Referencia", "referencia", "Ref", "ref"]),
    name: getVal(["Servicio", "servicio", "Name", "Nombre", "nombre"]),
    price: parseFloat(getVal(["Precio", "precio", "Price"]) || 0),
    duration: parseInt(getVal(["Duración", "duracion", "duración", "Duration"]) || 0) || null,
    category: getVal(["Categoría", "categoria", "Categoria", "Category"]),
    taxRate: parseFloat(getVal(["Impuesto", "impuesto", "Tax", "IVA"]) || 21),
    active: getVal(["Activo", "activo", "Active"]) === "NO" ? false : true,
    showOnline: getVal(["Mostrar online", "mostrar online"]) === "SÍ" || getVal(["Mostrar online", "mostrar online"]) === "SI",
    details: getVal(["Detalle", "detalle", "Details"]),
    employees: getVal(["Empleados", "empleados"]),
    tariffs: getVal(["Tarifas", "tarifas"])
  };
}

const filePathsToTry = [
  "C:\\Users\\Juan\\Downloads\\Servicios.xlsx",
  "C:\\Users\\Juan\\Downloads\\Servicios (1).xlsx",
  "C:\\Users\\Juan\\Downloads\\export_Servicios.xlsx",
  "C:\\Users\\Juan\\Downloads\\exportacion_servicios.xlsx",
  "C:\\Users\\Juan\\Downloads\\Koibox_Servicios.xlsx"
];

let targetFile = null;
for (const testPath of filePathsToTry) {
  if (fs.existsSync(testPath)) {
    targetFile = testPath;
    break;
  }
}

if (!targetFile) {
   // Let's list downloads to see if we can find a likely candidate if none matched explicitly
   const files = fs.readdirSync("C:\\Users\\Juan\\Downloads");
   const serviceCands = files.filter(f => f.toLowerCase().includes("servicio") && f.endsWith(".xlsx"));
   if (serviceCands.length > 0) {
      targetFile = path.join("C:\\Users\\Juan\\Downloads", serviceCands[0]);
   }
}

if (!targetFile) {
  console.log("No service excel file found to test.");
  process.exit(1);
}

console.log("Testing file:", targetFile);

try {
  const buffer = fs.readFileSync(targetFile);
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];
  const dataArrays = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  console.log("First 10 rows:");
  dataArrays.slice(0, 10).forEach((r, i) => console.log(`Row ${i}:`, r));
  if (dataArrays.length > 0) {
    console.log("Headers detected:", Object.keys(dataArrays[0] as any));
    console.log("Sample raw row 0:", dataArrays[0]);
    
    console.log("\nMapped result 0:", mapKoiboxHeadersToSchema(dataArrays[0]));
    
    // Check how many have valid names
    const mappedServices = dataArrays.map(mapKoiboxHeadersToSchema).filter((s: any) => s.name);
    console.log(`\nValid mapped services with name: ${mappedServices.length}`);
    if (mappedServices.length > 0) {
       console.log("First valid mapped service:", mappedServices[0]);
    } else {
       console.log("ERROR: NONE of the rows produced a valid 'name' property!");
    }
  }
} catch (e) {
  console.error(e);
}
