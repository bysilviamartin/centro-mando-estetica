import { notFound } from "next/navigation";
import { getServiceByReferencia } from "@/lib/excel";

type ServiceRow = {
  REFERENCIA?: string;
  NOMBRE?: string;
  CATEGORIA?: string;
  N_VECES?: number | string;
  IMPORTE_FACTURADO?: number | string;
  INGRESO_TEORICO?: number | string;
  INGRESO_X_HORA?: number | string;
  COSTE_TOTAL?: number | string;
  BENEFICIO_TOTAL?: number | string;
  MULTIPLICADOR_COSTE?: number | string;
  PVP?: number | string;
  PVP_MINIMO?: number | string;
  PVP_OBJETIVO?: number | string;
  PVP_PREMIUM?: number | string;
  DESVIACION_PVP?: number | string;
  ESTADO_SERVICIO?: string;
  ACCION?: string;
  "RENTABILIDAD_%"?: number | string;
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

/* ===== ESTILO BASE (MISMO LENGUAJE QUE EL RESTO) ===== */

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

/* ===== PAGE ===== */

export default async function ServiceDetailPage({ params }: PageProps) {
  const { referencia } = await params;
  const servicio = (await getServiceByReferencia(
    decodeURIComponent(referencia)
  )) as ServiceRow | null;

  if (!servicio) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* HEADER */}
      <div style={sectionStyle}>
        <div style={{ marginBottom: "10px", fontSize: "12px", opacity: 0.5 }}>
          Ficha de servicio
        </div>

        <div style={{ fontSize: "20px", fontWeight: 600 }}>
          {servicio.NOMBRE || "Servicio"}
        </div>

        <div style={{ marginTop: "12px", display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,1fr)" }}>
          <Field label="Referencia" value={String(servicio.REFERENCIA || "—")} />
          <Field label="Categoría" value={String(servicio.CATEGORIA || "—")} />
        </div>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {/* ACTIVIDAD */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Actividad</div>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,1fr)" }}>
            <Field label="Nº veces" value={formatNumber(servicio.N_VECES)} />
            <Field label="Ingreso/h" value={formatCurrency(servicio.INGRESO_X_HORA)} />
            <Field label="Facturación" value={formatCurrency(servicio.IMPORTE_FACTURADO)} />
            <Field label="Ingreso teórico" value={formatCurrency(servicio.INGRESO_TEORICO)} />
          </div>
        </div>

        {/* COSTES */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Costes y margen</div>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,1fr)" }}>
            <Field label="Coste" value={formatCurrency(servicio.COSTE_TOTAL)} />
            <Field label="Beneficio" value={formatCurrency(servicio.BENEFICIO_TOTAL)} />
            <Field label="Rentabilidad" value={formatPercent(servicio["RENTABILIDAD_%"])} />
            <Field label="Multiplicador" value={formatNumber(servicio.MULTIPLICADOR_COSTE)} />
          </div>
        </div>

        {/* PRECIO */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Precio</div>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,1fr)" }}>
            <Field label="PVP" value={formatCurrency(servicio.PVP)} />
            <Field label="Mínimo" value={formatCurrency(servicio.PVP_MINIMO)} />
            <Field label="Objetivo" value={formatCurrency(servicio.PVP_OBJETIVO)} />
            <Field label="Premium" value={formatCurrency(servicio.PVP_PREMIUM)} />
            <Field label="Desviación" value={formatCurrency(servicio.DESVIACION_PVP)} />
          </div>
        </div>

        {/* ESTADO */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Estado</div>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,1fr)" }}>
            <Field label="Estado" value={String(servicio.ESTADO_SERVICIO || "—")} />
            <Field label="Acción" value={String(servicio.ACCION || "—")} />
          </div>
        </div>
      </div>
    </div>
  );
}