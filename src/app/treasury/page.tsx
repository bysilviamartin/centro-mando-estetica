import {
  getSituacionActualTesoreria,
  getUltimosCierres,
  getUltimosGastos,
  getUltimosMovimientosTesoreria,
  getControlDescuadres,
} from "@/lib/excel";

function formatEuros(value: number) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function excelDateToString(excelDate: number) {
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
  return jsDate.toLocaleDateString("es-ES");
}

const cardStyle = {
  background: "#111",
  color: "#fff",
  padding: "15px",
  borderRadius: "10px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
};

const labelStyle = {
  fontSize: "12px",
  opacity: 0.7,
  marginBottom: "5px",
};

const valueStyle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
};

export default async function TreasuryPage() {
  const situacion = await getSituacionActualTesoreria();
  const ultimosCierres = await getUltimosCierres();
  const ultimosGastos = await getUltimosGastos();
  const ultimosMovimientosTesoreria =
    await getUltimosMovimientosTesoreria();
  const controlDescuadres = await getControlDescuadres();

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Situación actual
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Efectivo en caja</p>
          <p style={valueStyle}>{formatEuros(situacion.efectivoCaja)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Banco principal</p>
          <p style={valueStyle}>{formatEuros(situacion.bancoPrincipal)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Banco reserva</p>
          <p style={valueStyle}>{formatEuros(situacion.bancoReserva)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Liquidez inmediata</p>
          <p style={valueStyle}>
            {formatEuros(situacion.liquidezInmediata)} €
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginTop: "30px", marginBottom: "15px" }}>
        Últimos cierres
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ultimosCierres.map((cierre, index) => (
          <div key={index} style={cardStyle}>
            <p style={labelStyle}>
              {typeof cierre.fecha === "number"
                ? excelDateToString(cierre.fecha)
                : String(cierre.fecha ?? "")}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span>Efectivo: {formatEuros(cierre.efectivo)} €</span>
              <span>Tarjeta: {formatEuros(cierre.tarjeta)} €</span>
              <span>Total caja: {formatEuros(cierre.totalCaja)} €</span>
              <span>Total ventas: {formatEuros(cierre.totalVentas)} €</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "22px", marginTop: "30px", marginBottom: "15px" }}>
        Últimos gastos
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ultimosGastos.map((gasto, index) => (
          <div key={index} style={cardStyle}>
            <p style={labelStyle}>
              {typeof gasto.fechaPago === "number"
                ? excelDateToString(gasto.fechaPago)
                : String(gasto.fechaPago ?? "")}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span>Proveedor: {gasto.proveedor}</span>
              <span>Concepto: {gasto.concepto}</span>
              <span>Total: {formatEuros(gasto.total)} €</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "22px", marginTop: "30px", marginBottom: "15px" }}>
        Últimos movimientos bancarios
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ultimosMovimientosTesoreria.map((movimiento, index) => (
          <div key={index} style={cardStyle}>
            <p style={labelStyle}>
              {typeof movimiento.fecha === "number"
                ? excelDateToString(movimiento.fecha)
                : String(movimiento.fecha ?? "")}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span>Concepto: {movimiento.concepto}</span>
              <span>Cuenta: {movimiento.cuenta}</span>
              <span>Importe: {formatEuros(movimiento.importe)} €</span>
            </div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: "22px", marginTop: "30px", marginBottom: "15px" }}>
  Control reciente
</h2>

<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
  <div
    style={{
      ...cardStyle,
      borderLeft: controlDescuadres.hayDescuadres
        ? "4px solid #f97316"
        : "4px solid #22c55e",
    }}
  >
    <p style={valueStyle}>
      {controlDescuadres.hayDescuadres
        ? "⚠️ Hay descuadres recientes"
        : "✅ Todo correcto"}
    </p>
  </div>

  {controlDescuadres.ultimos.map((item, index) => (
    <div key={index} style={cardStyle}>
      <p style={labelStyle}>
        {typeof item.fecha === "number"
          ? excelDateToString(item.fecha)
          : String(item.fecha ?? "")}
      </p>
      <p style={valueStyle}>
        Descuadre: {formatEuros(item.descuadre)} €
      </p>
    </div>
  ))}
</div>
    </div>
  );
}