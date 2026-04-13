import { getProductosVistaGeneral } from "@/lib/excel";
import ProductosPorProveedor from "./ProductosPorProveedor";

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

function getMargenColor(value: number) {
  return value < 60 ? "#ef4444" : "#22c55e";
}

export default async function ProductsPage() {
  const productos = await getProductosVistaGeneral();

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
          <p style={labelStyle}>Productos activos</p>
          <p style={valueStyle}>
            {formatNumero(productos.resumen.numeroProductos)}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Ingreso total</p>
          <p style={valueStyle}>
            {formatEuros(productos.resumen.ingresoTotal)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Beneficio total</p>
          <p style={valueStyle}>
            {formatEuros(productos.resumen.beneficioTotal)} €
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Margen medio</p>
          <p
            style={{
              ...valueStyle,
              color: getMargenColor(productos.resumen.margenMedio),
            }}
          >
            {formatPorcentaje(productos.resumen.margenMedio)} %
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Productos rentables
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        {productos.productosRentables.map((producto, index) => (
          <div key={index} style={cardStyle}>
            <p style={labelStyle}>#{index + 1}</p>
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
              {producto.nombre}
            </h3>
            <p style={{ marginBottom: "6px" }}>
              Beneficio: {formatEuros(producto.beneficioTotal)} €
            </p>
            <p style={{ color: getMargenColor(producto.margen) }}>
              Margen: {formatPorcentaje(producto.margen)} %
            </p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Productos a revisar
      </h2>

      {productos.productosARevisar.length === 0 ? (
        <div style={{ ...cardStyle, marginBottom: "30px" }}>
          <p style={valueStyle}>No hay productos marcados para revisar.</p>
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
          {productos.productosARevisar.map((producto, index) => (
            <div key={index} style={cardStyle}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
                {producto.nombre}
              </h3>
              <p style={{ marginBottom: "6px" }}>Acción: {producto.accion}</p>
              <p
                style={{
                  marginBottom: "6px",
                  color: getMargenColor(producto.margen),
                }}
              >
                Margen: {formatPorcentaje(producto.margen)} %
              </p>
              <p>Beneficio: {formatEuros(producto.beneficioTotal)} €</p>
            </div>
          ))}
        </div>
      )}

      <ProductosPorProveedor data={productos.productosPorProveedor} />
    </div>
  );
}