import {
  getUltimoCierre,
  getResumenMes,
  getAlertasInicio,
  getTopServiciosInicio,
  getTopProductosInicio,
} from "@/lib/excel";

function excelDateToString(excelDate: number) {
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
  return jsDate.toLocaleDateString("es-ES");
}

function formatEuros(value: number) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

const alertaStyle = {
  ...cardStyle,
  padding: "10px",
  fontSize: "14px",
  borderLeft: "4px solid #ef4444",
};

export default async function InicioPage() {
    const cierre = await getUltimoCierre();
  const resumenMes = await getResumenMes();
  const alertas = await getAlertasInicio();
  const topServicios = await getTopServiciosInicio();
    const topProductos = await getTopProductosInicio();

  const fecha =
    typeof cierre.FECHA === "number"
      ? excelDateToString(cierre.FECHA)
      : String(cierre.FECHA ?? "");

  return (
    <div style={{ padding: "20px" }}>

      <h2 style={{ fontSize: "22px", marginBottom: "15px" }}>
  Último cierre
</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Fecha</p>
          <p style={valueStyle}>{fecha}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Total caja</p>
          <p style={valueStyle}>{formatEuros(cierre["TOTAL CAJA"] ?? 0)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Total ventas</p>
          <p style={valueStyle}>{formatEuros(cierre["TOTAL VENTAS"] ?? 0)} €</p>
        </div>

        <div
          style={{
            ...cardStyle,
            border:
              (cierre["DESCUADRE"] ?? 0) === 0
                ? "2px solid #22c55e"
                : "2px solid #ef4444",
          }}
        >
          <p style={labelStyle}>Descuadre</p>
          <p style={valueStyle}>{formatEuros(cierre["DESCUADRE"] ?? 0)} €</p>
        </div>
      </div>

      <h2 style={{ marginBottom: "22px" }}>Mes actual</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Facturación del mes</p>
          <p style={valueStyle}>{formatEuros(resumenMes.totalVentasMes)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Media diaria</p>
          <p style={valueStyle}>{formatEuros(resumenMes.mediaDiaria)} €</p>
        </div>
      </div>

      <h2 style={{ marginBottom: "22px" }}>Alertas</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={alertaStyle}>🔴 Falta de liquidez: {String(alertas.faltaLiquidez)}</div>
        <div style={alertaStyle}>🟠 Exceso de gastos: {String(alertas.excesoGastos)}</div>
        <div style={alertaStyle}>
          🟡 Comparativa mes anterior: {String(alertas.comparativaMesAnterior)}
        </div>
        <div style={alertaStyle}>🟠 Impuestos: {String(alertas.impuestosAltos)}</div>
        <div style={alertaStyle}>🔵 Restan: {String(alertas.restan)}</div>
      </div>
      <h2 style={{ marginTop: "30px", marginBottom: "22px" }}>
  Top servicios
</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  }}
>
  {topServicios.map((servicio, index) => (
    <div key={index} style={cardStyle}>
      <p style={labelStyle}>#{index + 1}</p>
      <p style={valueStyle}>{servicio.nombre}</p>
      <p style={labelStyle}>Beneficio total</p>
      <p style={valueStyle}>{formatEuros(servicio.beneficio)} €</p>
    </div>
  ))}
</div>
<h2 style={{ marginTop: "30px", marginBottom: "22px" }}>
  Top productos
</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  }}
>
  {topProductos.map((producto, index) => (
    <div key={index} style={cardStyle}>
      <p style={labelStyle}>#{index + 1}</p>
      <p style={valueStyle}>{producto.nombre}</p>
      <p style={labelStyle}>Beneficio total</p>
      <p style={valueStyle}>{formatEuros(producto.beneficio)} €</p>
    </div>
  ))}
</div>
    </div>
  );
}