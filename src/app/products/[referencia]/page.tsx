import { notFound } from "next/navigation";
import { getProductByReferencia } from "@/lib/excel";

type ProductRow = {
  REFERENCIA?: string;
  NOMBRE?: string;
  PROVEEDOR?: string;
  LINEA?: string;
  PRECIO_COSTE?: number | string;
  PVP?: number | string;
  MARGEN_UNITARIO?: number | string;
  "MARGEN_%"?: number | string;
  UNIDADES_VENDIDAS?: number | string;
  IMPORTE_FACTURADO?: number | string;
  COSTE_TOTAL?: number | string;
  BENEFICIO_TOTAL?: number | string;
  "PESO_EN_VENTAS_%"?: number | string;
  "PESO_EN_BENEFICIO_%"?: number | string;
  CLASIFICACION_ROTACION?: string;
  ESTADO_PRODUCTO?: string;
  ACCION?: string;
};

type PageProps = {
  params: Promise<{
    referencia: string;
  }>;
};

function formatCurrency(value: number | string | undefined) {
  const number = Number(value);
  if (isNaN(number)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}

function formatNumber(value: number | string | undefined) {
  const number = Number(value);
  if (isNaN(number)) return "—";
  return new Intl.NumberFormat("es-ES").format(number);
}

function formatPercent(value: number | string | undefined) {
  const number = Number(value);
  if (isNaN(number)) return "—";
  return `${number.toFixed(1)} %`;
}

const sectionStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "12px",
};

const fieldStyle: React.CSSProperties = {
  background: "#0d0d0d",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  padding: "10px 12px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  opacity: 0.6,
  marginBottom: "4px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={fieldStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { referencia } = await params;
  const producto = (await getProductByReferencia(
    decodeURIComponent(referencia)
  )) as ProductRow | null;

  if (!producto) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={sectionStyle}>
        <div style={{ marginBottom: "10px", fontSize: "12px", opacity: 0.5 }}>
          Ficha de producto
        </div>

        <div style={{ fontSize: "20px", fontWeight: 600 }}>
          {producto.NOMBRE || "Producto"}
        </div>

        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gap: "10px",
            gridTemplateColumns: "repeat(2,1fr)",
          }}
        >
          <Field
            label="Referencia"
            value={String(producto.REFERENCIA || "—")}
          />
          <Field
            label="Proveedor"
            value={String(producto.PROVEEDOR || "—")}
          />
          <Field
            label="Línea"
            value={String(producto.LINEA || "—")}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <div style={sectionStyle}>
          <div style={titleStyle}>Actividad comercial</div>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(2,1fr)",
            }}
          >
            <Field
              label="Unidades vendidas"
              value={formatNumber(producto.UNIDADES_VENDIDAS)}
            />
            <Field
              label="Importe facturado"
              value={formatCurrency(producto.IMPORTE_FACTURADO)}
            />
            <Field
              label="Peso en ventas"
              value={formatPercent(producto["PESO_EN_VENTAS_%"])}
            />
            <Field
              label="Rotación"
              value={String(producto.CLASIFICACION_ROTACION || "—")}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Costes y margen</div>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(2,1fr)",
            }}
          >
            <Field
              label="Precio coste"
              value={formatCurrency(producto.PRECIO_COSTE)}
            />
            <Field
              label="PVP"
              value={formatCurrency(producto.PVP)}
            />
            <Field
              label="Margen unitario"
              value={formatCurrency(producto.MARGEN_UNITARIO)}
            />
            <Field
              label="Margen %"
              value={formatPercent(producto["MARGEN_%"])}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Resultado acumulado</div>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(2,1fr)",
            }}
          >
            <Field
              label="Coste total"
              value={formatCurrency(producto.COSTE_TOTAL)}
            />
            <Field
              label="Beneficio total"
              value={formatCurrency(producto.BENEFICIO_TOTAL)}
            />
            <Field
              label="Peso en beneficio"
              value={formatPercent(producto["PESO_EN_BENEFICIO_%"])}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Estado</div>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(2,1fr)",
            }}
          >
            <Field
              label="Estado"
              value={String(producto.ESTADO_PRODUCTO || "—")}
            />
            <Field
              label="Acción"
              value={String(producto.ACCION || "—")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}