import {
  getResumenEquipoMesActual,
  getDetalleEquipoMesActual,
} from "@/lib/excel";

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

export default async function TeamPage() {
  const resumen = await getResumenEquipoMesActual();
  const detalle = await getDetalleEquipoMesActual();

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Resumen global del equipo
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
          <p style={labelStyle}>Ingresos</p>
          <p style={valueStyle}>{formatEuros(resumen.ingresos)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Servicios realizados</p>
          <p style={valueStyle}>{formatNumero(resumen.serviciosRealizados)}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Nº operaciones</p>
          <p style={valueStyle}>{formatNumero(resumen.operaciones)}</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Beneficio estimado</p>
          <p style={valueStyle}>{formatEuros(resumen.beneficioEstimado)} €</p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Rentabilidad</p>
          <p
            style={{
              ...valueStyle,
              color: resumen.rentabilidad < 60 ? "#ef4444" : "#22c55e",
            }}
          >
            {formatPorcentaje(resumen.rentabilidad)} %
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Equipo</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "15px",
        }}
      >
        {detalle.map((persona, index) => (
          <div key={index} style={cardStyle}>
            <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
              {persona.trabajadora}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <p style={{ ...labelStyle, fontSize: "13px" }}>Actividad</p>
              <p>
                Servicios realizados: {formatNumero(persona.serviciosRealizados)}
              </p>
              <p>Nº operaciones: {formatNumero(persona.operaciones)}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <p style={{ ...labelStyle, fontSize: "13px" }}>Rendimiento</p>
              <p>Ingresos: {formatEuros(persona.ingresos)} €</p>
              <p>
                Beneficio estimado: {formatEuros(persona.beneficioEstimado)} €
              </p>
              <p
                style={{
                  color: persona.rentabilidad < 60 ? "#ef4444" : "#22c55e",
                }}
              >
                Rentabilidad: {formatPorcentaje(persona.rentabilidad)} %
              </p>
              <p>Ingreso por hora: {formatEuros(persona.ingresoHora)} €</p>
            </div>

            <div>
              <p style={{ ...labelStyle, fontSize: "13px" }}>Objetivo</p>
              <p
                style={{
                  color:
                    persona.objetivoSaludable < 100 ? "#ef4444" : "#22c55e",
                }}
              >
                % objetivo saludable:{" "}
                {formatPorcentaje(persona.objetivoSaludable)} %
              </p>
              <p
                style={{
                  color: persona.diferencia < 0 ? "#ef4444" : "#22c55e",
                }}
              >
                Diferencia: {formatPorcentaje(persona.diferencia)} %
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}