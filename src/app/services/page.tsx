import { getServiciosVistaGeneral } from "@/lib/excel";
import ServiciosPorCategoria from "./ServiciosPorCategoria";

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

function getRentabilidadColor(value: number) {
  return value < 60 ? "#ef4444" : "#22c55e";
}

export default async function ServicesPage() {
  const servicios = await getServiciosVistaGeneral();

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Resumen general
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
          <p style={labelStyle}>Servicios activos</p>
          <p style={valueStyle}>
            {formatNumero(servicios.resumen.numeroServicios)}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Ingreso total</p>
          <p style={valueStyle}>
            {formatEuros(servicios.resumen.ingresoTotal)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Beneficio total</p>
          <p style={valueStyle}>
            {formatEuros(servicios.resumen.beneficioTotal)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Rentabilidad media</p>
          <p
            style={{
              ...valueStyle,
              color: getRentabilidadColor(servicios.resumen.rentabilidadMedia),
            }}
          >
            {formatPorcentaje(servicios.resumen.rentabilidadMedia)} %
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Servicios rentables
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        {servicios.serviciosRentables.map((servicio, index) => (
          <div key={index} style={cardStyle}>
            <p style={labelStyle}>#{index + 1}</p>
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
              {servicio.nombre}
            </h3>
            <p style={{ marginBottom: "6px" }}>
              Beneficio: {formatEuros(servicio.beneficioTotal)} €
            </p>
            <p style={{ color: getRentabilidadColor(servicio.rentabilidad) }}>
              Rentabilidad: {formatPorcentaje(servicio.rentabilidad)} %
            </p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Servicios a revisar
      </h2>

      {servicios.serviciosARevisar.length === 0 ? (
        <div style={{ ...cardStyle, marginBottom: "30px" }}>
          <p style={valueStyle}>No hay servicios marcados para revisar.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          {servicios.serviciosARevisar.map((servicio, index) => (
            <div key={index} style={cardStyle}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
                {servicio.nombre}
              </h3>
              <p style={{ marginBottom: "6px" }}>Acción: {servicio.accion}</p>
              <p
                style={{
                  marginBottom: "6px",
                  color: getRentabilidadColor(servicio.rentabilidad),
                }}
              >
                Rentabilidad: {formatPorcentaje(servicio.rentabilidad)} %
              </p>
              <p>Beneficio: {formatEuros(servicio.beneficioTotal)} €</p>
            </div>
          ))}
        </div>
      )}

      <ServiciosPorCategoria data={servicios.serviciosPorCategoria} />
    </div>
  );
}