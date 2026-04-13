import { getFiscalMesActual } from "@/lib/excel";

function formatEuros(value: number) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumero(value: number) {
  return value.toLocaleString("es-ES");
}

function formatPorcentaje(value: number) {
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

export default async function FiscalPage() {
  const fiscal = await getFiscalMesActual();

  if (!fiscal) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Fiscal</h2>
        <div style={cardStyle}>
          <p style={valueStyle}>No hay datos fiscales para el mes actual.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Situación fiscal actual
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
          <p style={labelStyle}>IVA repercutido</p>
          <p style={valueStyle}>{formatEuros(fiscal.ivaRepercutido)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>IVA soportado</p>
          <p style={valueStyle}>{formatEuros(fiscal.ivaSoportado)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Resultado IVA</p>
          <p
            style={{
              ...valueStyle,
              color: fiscal.resultadoIva > 0 ? "#ef4444" : "#22c55e",
            }}
          >
            {formatEuros(fiscal.resultadoIva)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>IRPF estimado</p>
          <p style={{ ...valueStyle, color: "#ef4444" }}>
            {formatEuros(fiscal.irpfEstimado)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Total provisión fiscal</p>
          <p style={{ ...valueStyle, color: "#ef4444" }}>
            {formatEuros(fiscal.totalProvision)} €
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Contexto del periodo
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
          <p style={labelStyle}>Año</p>
          <p style={valueStyle}>{formatNumero(fiscal.año)}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Mes</p>
          <p style={valueStyle}>{formatNumero(fiscal.mes)}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Trimestre</p>
          <p style={valueStyle}>{formatNumero(fiscal.trimestre)}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Beneficio estimado</p>
          <p style={valueStyle}>{formatEuros(fiscal.beneficioEstimado)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>% IRPF</p>
          <p style={valueStyle}>{formatPorcentaje(fiscal.porcentajeIrpf)} %</p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Control y ajuste
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Liquidación gestoría</p>
          <p style={valueStyle}>{formatEuros(fiscal.liquidacionGestoria)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Diferencia</p>
          <p
            style={{
              ...valueStyle,
              color:
                fiscal.diferencia > 0
                  ? "#ef4444"
                  : fiscal.diferencia < 0
                  ? "#22c55e"
                  : "#ffffff",
            }}
          >
            {formatEuros(fiscal.diferencia)} €
          </p>
        </div>
      </div>
    </div>
  );
}