import {
  getComparativaMensualActual,
  getHistoricoMensual,
} from "@/lib/excel";

function formatEuros(value: number) {
  if (!value || value === 0) return "—";

  return (
    value.toLocaleString("es-ES", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " €"
  );
}

function formatNumero(value: number) {
  if (!value || value === 0) return "—";

  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default async function HistoricalPage() {
  const comparativaMensual = await getComparativaMensualActual();
  const historico = await getHistoricoMensual();

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div
        style={{
          background: "#111",
          color: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          overflowX: "auto",
        }}
      >
        <h3 style={{ fontSize: "20px", marginBottom: "18px" }}>
          Comparativa mensual
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "760px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 10px",
                  fontSize: "12px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Año
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 10px",
                  fontSize: "12px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Mes
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "12px 10px",
                  fontSize: "12px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Total caja
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "12px 10px",
                  fontSize: "12px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Días abiertos
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "12px 10px",
                  fontSize: "12px",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Media diaria
              </th>
            </tr>
          </thead>

          <tbody>
            {comparativaMensual.map((row) => (
              <tr key={`${row.año}-${row.mes}`} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td
                  style={{
                    padding: "14px 10px",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                  }}
                >
                  {row.año}
                </td>
                <td
                  style={{
                    padding: "14px 10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                  }}
                >
                  {row.mesNombre}
                </td>
                <td
                  style={{
                    padding: "14px 10px",
                    fontSize: "14px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatEuros(row.totalCaja)}
                </td>
                <td
                  style={{
                    padding: "14px 10px",
                    fontSize: "14px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatNumero(row.diasAbiertos)}
                </td>
                <td
                  style={{
                    padding: "14px 10px",
                    fontSize: "14px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatEuros(row.mediaDiaria)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: "#111",
          color: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          overflowX: "auto",
        }}
      >
        <h3 style={{ fontSize: "20px", marginBottom: "18px" }}>
          Histórico mensual
        </h3>

        <table
          className="historical-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "760px",
            backgroundColor: "transparent",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 10px 16px 10px",
                  fontSize: "12px",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Mes
              </th>

              {historico.years.map((year) => (
                <th
                  key={year}
                  style={{
                    textAlign: "right",
                    padding: "12px 10px 16px 10px",
                    fontSize: "12px",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 500,
                  }}
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {historico.rows.map((row) => (
              <tr key={row.mesNumero}>
                <td
                  style={{
                    padding: "16px 10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    color: "#ffffff",
                  }}
                >
                  {row.mesNombre}
                </td>

                {row.valores.map((item) => (
                  <td
                    key={`${row.mesNumero}-${item.year}`}
                    style={{
                      padding: "16px 10px",
                      fontSize: "14px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      color: "#ffffff",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatEuros(item.value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}