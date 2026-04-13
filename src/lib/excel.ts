import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

type CierreRow = {
  FECHA?: number | string;
  EFECTIVO?: number;
  "VOLV. EF."?: number;
  TARJETA?: number;
  "VOLV. TJTA."?: number;
  "TRANSF."?: number;
  BIZUM?: number;
  "TOTAL CAJA"?: number;
  "TOTAL VENTAS"?: number;
  DESCUADRE?: number;
  "DEUDA EF."?: number;
  "DEUDA TJTA."?: number;
  BASE_IMPONIBLE?: number;
  IVA?: number;
};

function getWorkbook() {
  const filePath = path.resolve(
    "C:/Users/Juan/OneDrive/Documentos/PROYECTO NUEVO.xlsx"
  );

  const fileBuffer = fs.readFileSync(filePath);
  return XLSX.read(fileBuffer, { type: "buffer" });
}

function getCajasDiariasRows(): CierreRow[] {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["08_CAJAS_DIARIAS"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 08_CAJAS_DIARIAS");
  }

  return XLSX.utils.sheet_to_json<CierreRow>(sheet);
}

function excelDateToJsDate(excelDate: number) {
  return new Date((excelDate - 25569) * 86400 * 1000);
}
function parseExcelNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;

  const text = String(value).trim();

  if (!text || text === "-" || text === "- €" || text === "-   €") return 0;

  const normalized = text
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const num = parseFloat(normalized);
  return Number.isNaN(num) ? 0 : num;
}

export async function getUltimoCierre(): Promise<CierreRow> {
  const data = getCajasDiariasRows();
  const ultimaFila = data[data.length - 1];

  if (!ultimaFila) {
    throw new Error("La hoja 08_CAJAS_DIARIAS no tiene datos");
  }

  return ultimaFila;
}

export async function getResumenMes(): Promise<{
  totalVentasMes: number;
  mediaDiaria: number;
}> {
  const data = getCajasDiariasRows();
  const ultimaFila = data[data.length - 1];

  if (!ultimaFila || typeof ultimaFila.FECHA !== "number") {
    throw new Error("No se pudo obtener la fecha del último cierre");
  }

  const jsDate = excelDateToJsDate(ultimaFila.FECHA);
  const mes = jsDate.getMonth();
  const año = jsDate.getFullYear();

  const datosMes = data.filter((row) => {
    if (typeof row.FECHA !== "number") return false;
    const d = excelDateToJsDate(row.FECHA);
    return d.getMonth() === mes && d.getFullYear() === año;
  });

  const totalVentasMes = datosMes.reduce(
    (sum, row) => sum + (row["TOTAL VENTAS"] ?? 0),
    0
  );

  const mediaDiaria =
    datosMes.length > 0 ? totalVentasMes / datosMes.length : 0;

  return {
    totalVentasMes,
    mediaDiaria,
  };
}

export async function getAlertasInicio() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["CONTROL_DIARIO"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja CONTROL_DIARIO");
  }

  return {
    faltaLiquidez: sheet["E18"]?.v ?? "",
    excesoGastos: sheet["E19"]?.v ?? "",
    comparativaMesAnterior: sheet["E20"]?.v ?? "",
    impuestosAltos: sheet["E21"]?.v ?? "",
    restan: sheet["E22"]?.v ?? "",
  };
}

export async function getTopServiciosInicio() {
  try {
    const workbook = getWorkbook();
    const sheet = workbook.Sheets["13_ANALISIS_SERVICIOS"];

    if (!sheet) {
      throw new Error("No se encuentra la hoja 13_ANALISIS_SERVICIOS");
    }

    const data = XLSX.utils.sheet_to_json<any>(sheet);

    return data
      .filter(
        (row) =>
          row["NOMBRE"] &&
          row["BENEFICIO_TOTAL"] !== undefined &&
          row["BENEFICIO_TOTAL"] !== null
      )
      .map((row) => ({
        nombre: String(row["NOMBRE"]),
        beneficio: Number(row["BENEFICIO_TOTAL"]) || 0,
      }))
      .sort((a, b) => b.beneficio - a.beneficio)
      .slice(0, 3);
  } catch (error) {
    console.error("Error leyendo TOP servicios:", error);
    return [];
  }
}

export async function getTopProductosInicio() {
  try {
    const workbook = getWorkbook();
    const sheet = workbook.Sheets["14_ANALISIS_PROD_VENTA"];

    if (!sheet) {
      throw new Error("No se encuentra la hoja 14_ANALISIS_PROD_VENTA");
    }

    const data = XLSX.utils.sheet_to_json<any>(sheet);

    return data
      .filter(
        (row) =>
          row["NOMBRE"] &&
          row["BENEFICIO_TOTAL"] !== undefined &&
          row["BENEFICIO_TOTAL"] !== null
      )
      .map((row) => ({
        nombre: String(row["NOMBRE"]),
        beneficio: Number(row["BENEFICIO_TOTAL"]) || 0,
      }))
      .sort((a, b) => b.beneficio - a.beneficio)
      .slice(0, 3);
  } catch (error) {
    console.error("Error leyendo TOP productos:", error);
    return [];
  }
}

export async function getSituacionActualTesoreria() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["CONTROL_DIARIO"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja CONTROL_DIARIO");
  }

  return {
    efectivoCaja: Number(sheet["B9"]?.v ?? 0),
    bancoPrincipal: Number(sheet["B12"]?.v ?? 0),
    bancoReserva: Number(sheet["B13"]?.v ?? 0),
    liquidezInmediata: Number(sheet["B15"]?.v ?? 0),
  };
}

export async function getUltimosCierres() {
  const data = getCajasDiariasRows();

  return data
    .slice(-3)
    .reverse()
    .map((row) => ({
      fecha: row["FECHA"],
      efectivo: Number(row["EFECTIVO"] ?? 0),
      tarjeta: Number(row["TARJETA"] ?? 0),
      totalCaja: Number(row["TOTAL CAJA"] ?? 0),
      totalVentas: Number(row["TOTAL VENTAS"] ?? 0),
    }));
}

export async function getUltimosGastos() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["05_IMPORT_GASTOS"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 05_IMPORT_GASTOS");
  }

  const data = XLSX.utils.sheet_to_json<any>(sheet);

  return data
    .filter(
      (row) =>
        row["F. PAGO"] &&
        row["TOTAL"] !== undefined &&
        row["TOTAL"] !== null
    )
    .slice(-3)
    .reverse()
    .map((row) => ({
      fechaPago: row["F. PAGO"],
      proveedor: String(row["PROVEEDOR"] ?? ""),
      concepto: String(row["CONCEPTO"] ?? ""),
      total: Number(row["TOTAL"] ?? 0),
    }));
}

export async function getUltimosMovimientosTesoreria() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["06_IMPORT_TESORERIA"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 06_IMPORT_TESORERIA");
  }

  const data = XLSX.utils.sheet_to_json<any>(sheet);

  return data
    .filter((row) => row["FECHA"] && row["CONCEPTO"])
    .slice(-3)
    .reverse()
    .map((row) => {
      const ingresos = Number(row["INGRESOS"] ?? 0);
      const gastos = Number(row["GASTOS"] ?? 0);
      const principal = Number(row["PRINCIPAL"] ?? 0);
      const reserva = Number(row["RESERVA"] ?? 0);
      const traspasos = Number(row["TRASPASOS"] ?? 0);

      let importe = 0;
      if (ingresos > 0) importe = ingresos;
      else if (gastos > 0) importe = -gastos;
      else if (traspasos > 0) importe = traspasos;

      let cuenta = "";
      if (principal !== 0) cuenta = "Banco principal";
      else if (reserva !== 0) cuenta = "Banco reserva";
      else if (traspasos !== 0) cuenta = "Traspaso";

      return {
        fecha: row["FECHA"],
        concepto: String(row["CONCEPTO"] ?? ""),
        importe,
        cuenta,
      };
    });
}
export async function getControlDescuadres() {
  const data = getCajasDiariasRows();

  const ultimos = data
    .slice(-3)
    .reverse()
    .map((row) => ({
      fecha: row["FECHA"],
      descuadre: Number(row["DESCUADRE"] ?? 0),
    }));

  const hayDescuadres = ultimos.some((d) => d.descuadre !== 0);

  return {
    ultimos,
    hayDescuadres,
  };
}
export async function getResumenEquipoMesActual() {
  const dataCajas = getCajasDiariasRows();
  const ultimaFila = dataCajas[dataCajas.length - 1];

  if (!ultimaFila || typeof ultimaFila.FECHA !== "number") {
    throw new Error("No se pudo obtener la fecha del último cierre");
  }

  const fecha = excelDateToJsDate(ultimaFila.FECHA);
  const mesActual = fecha.getMonth() + 1;
  const añoActual = fecha.getFullYear();

  const workbook = getWorkbook();
  const sheet = workbook.Sheets["10_RENTABILIDAD_EQUIPO"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 10_RENTABILIDAD_EQUIPO");
  }

  const data = XLSX.utils.sheet_to_json<any>(sheet);

  const filasMes = data.filter((row) => {
    const año = parseInt(String(row[" AÑO "] ?? "").trim());
    const mes = parseInt(String(row[" MES "] ?? "").trim());
    return año === añoActual && mes === mesActual;
  });

  const ingresos = filasMes.reduce(
    (sum, row) => sum + Number(row[" INGRESOS "] ?? 0),
    0
  );

  const serviciosRealizados = filasMes.reduce(
    (sum, row) => sum + Number(row["SERVICIOS_REALIZADOS"] ?? 0),
    0
  );

  const operaciones = filasMes.reduce(
    (sum, row) => sum + Number(row["Nº_OPERACIONES"] ?? 0),
    0
  );

  const beneficioEstimado = filasMes.reduce(
    (sum, row) => sum + Number(row["BENEFICIO_ESTIMADO"] ?? 0),
    0
  );

  const rentabilidad =
    ingresos > 0 ? (beneficioEstimado / ingresos) * 100 : 0;

  return {
    ingresos,
    serviciosRealizados,
    operaciones,
    beneficioEstimado,
    rentabilidad,
  };
}
export async function getDetalleEquipoMesActual() {
  const dataCajas = getCajasDiariasRows();
  const ultimaFila = dataCajas[dataCajas.length - 1];

  if (!ultimaFila || typeof ultimaFila.FECHA !== "number") {
    throw new Error("No se pudo obtener la fecha del último cierre");
  }

  const fecha = excelDateToJsDate(ultimaFila.FECHA);
  const mesActual = fecha.getMonth() + 1;
  const añoActual = fecha.getFullYear();

  const workbook = getWorkbook();
  const sheet = workbook.Sheets["10_RENTABILIDAD_EQUIPO"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 10_RENTABILIDAD_EQUIPO");
  }

  const data = XLSX.utils.sheet_to_json<any>(sheet);

  return data
    .filter((row) => {
      const año = parseInt(String(row[" AÑO "] ?? "").trim());
      const mes = parseInt(String(row[" MES "] ?? "").trim());
      return año === añoActual && mes === mesActual;
    })
    .map((row) => ({
      trabajadora: String(row[" TRABAJADORA "] ?? "").trim(),
      ingresos: Number(row[" INGRESOS "] ?? 0),
      serviciosRealizados: Number(row["SERVICIOS_REALIZADOS"] ?? 0),
      operaciones: Number(row["Nº_OPERACIONES"] ?? 0),
      beneficioEstimado: Number(row["BENEFICIO_ESTIMADO"] ?? 0),
      rentabilidad: Number(row["RENTABILIDAD_%"] ?? 0) * 100,
      ingresoHora: Number(row["INGRESO_X_HORA"] ?? 0),
      objetivoSaludable: Number(row["%_OBJETIVO_SALUDABLE"] ?? 0) * 100,
      diferencia: Number(row["DIFERENCIA_%"] ?? 0) * 100,
    }));
}
export async function getFiscalMesActual() {
  const dataCajas = getCajasDiariasRows();
  const ultimaFila = dataCajas[dataCajas.length - 1];

  if (!ultimaFila || typeof ultimaFila.FECHA !== "number") {
    throw new Error("No se pudo obtener la fecha del último cierre");
  }

  const fecha = excelDateToJsDate(ultimaFila.FECHA);
  const mesActual = fecha.getMonth() + 1;
  const añoActual = fecha.getFullYear();

  const workbook = getWorkbook();
  const sheet = workbook.Sheets["09_CONTROL_FISCAL"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 09_CONTROL_FISCAL");
  }

  const data = XLSX.utils.sheet_to_json<any>(sheet);

  const fila = data.find((row) => {
    const año = parseInt(String(row["AÑO"] ?? "").trim());
    const mes = parseInt(String(row["MES"] ?? "").trim());
    return año === añoActual && mes === mesActual;
  });

  if (!fila) {
    return null;
  }

  return {
    año: parseExcelNumber(fila["AÑO"]),
    mes: parseExcelNumber(fila["MES"]),
    trimestre: parseExcelNumber(fila["TRIMESTRE"]),

    ivaRepercutido: parseExcelNumber(fila["IVA_REPERCUTIDO"]),
    ivaSoportado: parseExcelNumber(fila["IVA_SOPORTADO"]),
    resultadoIva: parseExcelNumber(fila["RESULTADO_IVA"]),

    beneficioEstimado: parseExcelNumber(fila["BENEFICIO_ESTIMADO"]),
    porcentajeIrpf: parseExcelNumber(fila["%_IRPF"]) * 100,
    irpfEstimado: parseExcelNumber(fila["IRPF_ESTIMADO"]),

    totalProvision: parseExcelNumber(fila["TOTAL_PROVISION_FISCAL"]),

    liquidacionGestoria: parseExcelNumber(fila["LIQUIDACION_GESTORIA"]),
    diferencia: parseExcelNumber(fila["DIFERENCIA"]),
  };
}
// ===== SERVICIOS =====

export async function getServiciosVistaGeneral() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["13_ANALISIS_SERVICIOS"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 13_ANALISIS_SERVICIOS");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  const serviciosConUsoReal = data
    .map((row) => ({
      referencia: String(row["REFERENCIA"] ?? "").trim(),
      nombre: String(row["NOMBRE"] ?? "").trim(),
      categoria: String(row["CATEGORIA"] ?? "").trim(),
      nVeces: Number(row["N_VECES"] ?? 0),
      importeFacturado: Number(row["IMPORTE_FACTURADO"] ?? 0),
      costeTotal: Number(row["COSTE_TOTAL"] ?? 0),
      beneficioTotal: Number(row["BENEFICIO_TOTAL"] ?? 0),
      rentabilidad: Number(row["RENTABILIDAD_%"] ?? 0) * 100,
      estadoServicio: String(row["ESTADO_SERVICIO"] ?? "").trim(),
      accion: String(row["ACCION"] ?? "").trim(),
    }))
    .filter((row) => row.nVeces > 0 || row.importeFacturado > 0);

  const numeroServicios = serviciosConUsoReal.length;

  const ingresoTotal = serviciosConUsoReal.reduce(
    (sum, row) => sum + row.importeFacturado,
    0
  );

  const beneficioTotal = serviciosConUsoReal.reduce(
    (sum, row) => sum + row.beneficioTotal,
    0
  );

  const rentabilidadMedia =
    ingresoTotal > 0 ? (beneficioTotal / ingresoTotal) * 100 : 0;

  const serviciosRentables = [...serviciosConUsoReal]
    .sort((a, b) => b.beneficioTotal - a.beneficioTotal)
    .slice(0, 4);

  const serviciosARevisar = serviciosConUsoReal
    .filter((row) => row.accion !== "")
    .sort((a, b) => a.beneficioTotal - b.beneficioTotal)
    .slice(0, 4);

  const serviciosPorCategoria = serviciosConUsoReal.reduce((acc, servicio) => {
    const categoria = servicio.categoria || "SIN CATEGORIA";

    if (!acc[categoria]) {
      acc[categoria] = [];
    }

    acc[categoria].push(servicio);

    return acc;
  }, {} as Record<string, typeof serviciosConUsoReal>);

  const categoriasOrdenadas = Object.fromEntries(
    Object.entries(serviciosPorCategoria)
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([categoria, lista]) => [
        categoria,
        [...lista].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es")
        ),
      ])
  );

  return {
    resumen: {
      numeroServicios,
      ingresoTotal,
      beneficioTotal,
      rentabilidadMedia,
    },
    serviciosRentables,
    serviciosARevisar,
    serviciosPorCategoria: categoriasOrdenadas,
  };
}

export async function getAnalisisServicios() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["13_ANALISIS_SERVICIOS"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 13_ANALISIS_SERVICIOS");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  return data;
}

export async function getServiceByReferencia(referencia: string) {
  const data = await getAnalisisServicios();

  if (!data || data.length === 0) return null;

  const referenciaBuscada = String(referencia ?? "").trim();

  const servicio = data.find((row: any) => {
    const referenciaFila = String(row["REFERENCIA"] ?? "").trim();
    return referenciaFila === referenciaBuscada;
  });

  return servicio || null;
}
// ===== PRODUCTOS =====

export async function getProductosVistaGeneral() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["14_ANALISIS_PROD_VENTA"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 14_ANALISIS_PROD_VENTA");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  const productosConUsoReal = data
    .map((row) => ({
      referencia: String(row["REFERENCIA"] ?? "").trim(),
      nombre: String(row["NOMBRE"] ?? "").trim(),
      proveedor: String(row["PROVEEDOR"] ?? "").trim(),
      unidadesVendidas: Number(row["UNIDADES_VENDIDAS"] ?? 0),
      importeFacturado: Number(row["IMPORTE_FACTURADO"] ?? 0),
      costeTotal: Number(row["COSTE_TOTAL"] ?? 0),
      beneficioTotal: Number(row["BENEFICIO_TOTAL"] ?? 0),
      margen: Number(row["MARGEN_%"] ?? 0) * 100,
      estadoProducto: String(row["ESTADO_PRODUCTO"] ?? "").trim(),
      accion: String(row["ACCION"] ?? "").trim(),
    }))
    .filter((row) => row.unidadesVendidas > 0 || row.importeFacturado > 0);

  const numeroProductos = productosConUsoReal.length;

  const ingresoTotal = productosConUsoReal.reduce(
    (sum, row) => sum + row.importeFacturado,
    0
  );

  const beneficioTotal = productosConUsoReal.reduce(
    (sum, row) => sum + row.beneficioTotal,
    0
  );

  const margenMedio = ingresoTotal > 0 ? (beneficioTotal / ingresoTotal) * 100 : 0;

  const productosRentables = [...productosConUsoReal]
    .sort((a, b) => b.beneficioTotal - a.beneficioTotal)
    .slice(0, 4);

  const productosARevisar = productosConUsoReal
    .filter((row) => row.accion !== "")
    .sort((a, b) => a.beneficioTotal - b.beneficioTotal)
    .slice(0, 4);

  const productosPorProveedor = productosConUsoReal.reduce((acc, producto) => {
    const proveedor = producto.proveedor || "SIN PROVEEDOR";

    if (!acc[proveedor]) {
      acc[proveedor] = [];
    }

    acc[proveedor].push(producto);

    return acc;
  }, {} as Record<string, typeof productosConUsoReal>);

  const proveedoresOrdenados = Object.fromEntries(
    Object.entries(productosPorProveedor)
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([proveedor, lista]) => [
        proveedor,
        [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      ])
  );

  return {
    resumen: {
      numeroProductos,
      ingresoTotal,
      beneficioTotal,
      margenMedio,
    },
    productosRentables,
    productosARevisar,
    productosPorProveedor: proveedoresOrdenados,
  };
}

export async function getAnalisisProductos() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["14_ANALISIS_PROD_VENTA"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 14_ANALISIS_PROD_VENTA");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  return data;
}

export async function getProductByReferencia(referencia: string) {
  const data = await getAnalisisProductos();

  if (!data || data.length === 0) return null;

  const referenciaBuscada = String(referencia ?? "").trim();

  const producto = data.find((row: any) => {
    const referenciaFila = String(row["REFERENCIA"] ?? "").trim();
    return referenciaFila === referenciaBuscada;
  });

  return producto || null;
}
// ===== HISTORICO =====

export async function getHistoricoMensual() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["12_HISTORICO_MENSUAL"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 12_HISTORICO_MENSUAL");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  const mesesMap: Record<string, string> = {
    "1": "Enero",
    "2": "Febrero",
    "3": "Marzo",
    "4": "Abril",
    "5": "Mayo",
    "6": "Junio",
    "7": "Julio",
    "8": "Agosto",
    "9": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };

  const columnas = Object.keys(data[0] || {});
  const yearColumns = columnas.filter((col) => col !== "MES");

  const rows = data.map((row) => {
    const mesNumero = String(row["MES"] ?? "").trim();

    const valores = yearColumns.map((year) => ({
      year,
      value: Number(row[year] ?? 0),
    }));

    return {
      mesNumero,
      mesNombre: mesesMap[mesNumero] || mesNumero,
      valores,
    };
  });

  return {
    years: yearColumns,
    rows,
  };
}
// ===== HISTORICO - AÑO EN CURSO =====

export async function getComparativaMensualActual() {
  const workbook = getWorkbook();
  const sheet = workbook.Sheets["11_ANALISIS_CAJAS"];

  if (!sheet) {
    throw new Error("No se encuentra la hoja 11_ANALISIS_CAJAS");
  }

  const rawData = XLSX.utils.sheet_to_json<any>(sheet);

  const data = rawData.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [String(key).trim(), value])
    )
  );

  const mesesMap: Record<string, string> = {
    "1": "Enero",
    "2": "Febrero",
    "3": "Marzo",
    "4": "Abril",
    "5": "Mayo",
    "6": "Junio",
    "7": "Julio",
    "8": "Agosto",
    "9": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };

  const filasValidas = data.filter(
    (row) =>
      row["Año"] !== undefined &&
      row["Mes"] !== undefined &&
      row["Total Caja (€)"] !== undefined
  );

  if (filasValidas.length === 0) {
    return [];
  }

  const ultimoAño = Math.max(
    ...filasValidas.map((row) => Number(row["Año"] ?? 0))
  );

  const resultado = filasValidas
    .filter((row) => Number(row["Año"]) === ultimoAño)
    .map((row) => {
      const mesNumero = Number(row["Mes"] ?? 0);

      return {
        año: Number(row["Año"] ?? 0),
        mes: mesNumero,
        mesNombre: mesesMap[String(mesNumero)] || String(mesNumero),
        totalCaja: Number(row["Total Caja (€)"] ?? 0),
        diasAbiertos: Number(row["Dias abiertos"] ?? 0),
        mediaDiaria: Number(row["Media Diaria"] ?? 0),
      };
    })
    .sort((a, b) => a.mes - b.mes);

  return resultado;
}