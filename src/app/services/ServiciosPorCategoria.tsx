"use client";

import Link from "next/link";
import { useState } from "react";

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

type Servicio = {
  referencia: string;
  nombre: string;
  importeFacturado: number;
};

export default function ServiciosPorCategoria({
  data,
}: {
  data: Record<string, Servicio[]>;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
        Servicios por familia
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.entries(data).map(([categoria, lista], index) => {
          const isOpen = openCategory === categoria;

          return (
            <div key={index} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: "10px",
                }}
                onClick={() => setOpenCategory(isOpen ? null : categoria)}
              >
                <div>
                  <strong>{categoria}</strong>
                  <p
                    style={{
                      ...labelStyle,
                      marginTop: "6px",
                      marginBottom: 0,
                    }}
                  >
                    {lista.length} servicios
                  </p>
                </div>

                <span style={{ fontSize: "22px", lineHeight: 1 }}>
                  {isOpen ? "−" : "+"}
                </span>
              </div>

              {isOpen && (
                <div style={{ marginTop: "12px" }}>
                  {lista.map((servicio, i) => (
                    <Link
                      key={`${servicio.referencia}-${i}`}
                      href={`/services/${encodeURIComponent(
                        servicio.referencia
                      )}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 0",
                          borderBottom:
                            i === lista.length - 1
                              ? "none"
                              : "1px solid #222",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <p style={{ margin: 0 }}>
                            {servicio.referencia} — {servicio.nombre}
                          </p>
                        </div>

                        <div
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          <p style={{ margin: 0 }}>
                            {formatEuros(servicio.importeFacturado)} €
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}