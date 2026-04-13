import AppNav from "@/components/AppNav";
import fs from "fs";
import path from "path";

function detectDelimiter(line: string) {
  return line.includes(";") ? ";" : ",";
}

function parseCSV(data: string) {
  const lines = data.trim().split(/\r?\n/);
  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0].split(delimiter).map((item) => item.trim());
  const values = lines[1].split(delimiter).map((item) => item.trim());

  const result: Record<string, string> = {};

  headers.forEach((header, i) => {
    result[header] = values[i] ?? "";
  });

  return result;
}

function toNumber(value: string) {
  if (!value) return NaN;

  const cleanValue = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("€", "")
    .replace("%", "")
    .trim();

  return Number(cleanValue);
}

function formatNumber(value: string) {
  if (!value) return "0";

  const num = toNumber(value);
  if (Number.isNaN(num)) return value;

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatCurrency(value: string) {
  if (!value) return "0 €";

  const num = toNumber(value);
  if (Number.isNaN(num)) return value;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatPercent(value: string) {
  if (!value) return "0 %";

  const num = toNumber(value);
  if (Number.isNaN(num)) return value;

  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)} %`;
}

type CardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
  format?: "number" | "currency" | "percent";
};

function ValueCard({
  label,
  value,
  tone = "default",
  format = "number",
}: CardProps) {
  const toneStyles = {
    default: {
      border: "#2b2b2b",
      text: "#ffffff",
      bg: "#111111",
    },
    success: {
      border: "#2f6b4f",
      text: "#d8ffe8",
      bg: "#0f1713",
    },
    danger: {
      border: "#7a3b3b",
      text: "#ffd9d9",
      bg: "#1a1010",
    },
  };

  const selectedTone = toneStyles[tone];

  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? formatPercent(value)
      : formatNumber(value);

  return (
    <div
      style={{
        border: `1px solid ${selectedTone.border}`,
        borderRadius: "20px",
        padding: "22px",
        background: selectedTone.bg,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#c9a882",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: selectedTone.text,
          lineHeight: 1.1,
        }}
      >
        {formattedValue}
      </div>
    </div>
  );
}

export default function ControlDiarioPage() {
  const filePath = path.join(process.cwd(), "data", "control_diario.csv");
  const file = fs.readFileSync(filePath, "utf8");
  const data = parseCSV(file);

  const restanNumber = toNumber(data.RESTAN);
  const beneficioNumber = toNumber(data.BENEFICIO);

  const restanTone =
    !Number.isNaN(restanNumber) && restanNumber > 0 ? "danger" : "success";

  const beneficioTone =
    !Number.isNaN(beneficioNumber) && beneficioNumber < 0
      ? "danger"
      : "success";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000000",
        color: "#ffffff",
        padding: "32px",
        fontFamily: "Montserrat, Arial, sans-serif",
      }}
    >
        <AppNav />
        
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#c9a882",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Centro de mando
          </div>

          <h1
            style={{
              fontSize: "40px",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "8px",
              fontFamily: "Playfair Display, Georgia, serif",
              fontWeight: 600,
            }}
          >
            Control diario
          </h1>

          <p style={{ margin: 0, color: "#bdbdbd", fontSize: "15px" }}>
            Fecha de control: <span style={{ color: "#ffffff" }}>{data.FECHA_CONTROL}</span>
          </p>
        </header>

        <section style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            <ValueCard
              label="Liquidez inmediata"
              value={data.LIQUIDEZ}
              tone="default"
              format="currency"
            />
            <ValueCard
              label="Restan"
              value={data.RESTAN}
              tone={restanTone}
              format="currency"
            />
            <ValueCard
              label="Ingresos mes"
              value={data.INGRESOS_MES}
              tone="default"
              format="currency"
            />
            <ValueCard
              label="Beneficio"
              value={data.BENEFICIO}
              tone={beneficioTone}
              format="currency"
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid #1f1f1f",
            borderRadius: "24px",
            padding: "24px",
            background: "#0a0a0a",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#c9a882",
              marginBottom: "18px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Indicadores secundarios
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <ValueCard label="Gastos mes" value={data.GASTOS_MES} format="currency" />
            <ValueCard label="IVA estimado" value={data.IVA_ESTIMADO} format="currency" />
            <ValueCard label="IRPF estimado" value={data.IRPF_ESTIMADO} format="currency" />
            <ValueCard label="Visitas" value={data.VISITAS} format="number" />
            <ValueCard label="Ticket medio" value={data.TICKET_MEDIO} format="currency" />
            <ValueCard label="Servicios" value={data.SERVICIOS} format="number" />
            <ValueCard label="Rentabilidad" value={data.RENTABILIDAD} format="percent" />
            <ValueCard label="Ingreso por hora" value={data.INGRESO_HORA} format="currency" />
          </div>
        </section>
      </div>
    </main>
  );
}