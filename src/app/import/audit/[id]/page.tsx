import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportAuditPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);
  const session = await prisma.importSession.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { ticketNumber: 'asc' }
      }
    }
  });

  if (!session) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2>Import Session Not Found</h2>
        <Link href="/import" style={{ color: "var(--accent-foreground)", textDecoration: "underline" }}>Back to Imports</Link>
      </div>
    );
  }

  // Group sales by Ticket Number
  const groupedTickets = session.sales.reduce((acc: any, sale: any) => {
    const tnum = sale.ticketNumber || "SIN TICKET";
    if (!acc[tnum]) acc[tnum] = [];
    acc[tnum].push(sale);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link href="/import" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <ArrowLeft size={16} /> Volver a Importaciones
        </Link>
      </div>
      
      <h1 className="page-title brand-font" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <FileText size={28} /> Auditoría de Tickets
      </h1>
      <p className="page-subtitle">Desglose línea a línea de la sesión de importación <strong>{session.filename}</strong></p>

      {/* Audit Guide */}
      <div style={{ backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "3rem", borderLeft: "3px solid var(--accent-foreground)" }}>
        <h3 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--primary)" }}>¿Cómo leer esta auditoría?</h3>
        <ul style={{ fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "1.25rem", display: "grid", gap: "0.5rem" }}>
          <li>Esta vista lista <strong>todas las líneas válidas</strong> que el sistema ingresó desde el archivo de ventas.</li>
          <li>Cada bloque representa un <strong>Ticket único</strong> según el Excel.</li>
          <li>Si una fila del ticket suma para el "Ingreso Fiscal Real", verás su Importe marcado con la estrella <span style={{ color: "var(--accent-foreground)" }}>★</span>.</li>
          <li>Líneas con 0€ (ej. Consumos de Bonos reales) ahora aparecen y son totalmente operativas.</li>
        </ul>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {Object.entries(groupedTickets).map(([ticketNumber, sales]: [string, any]) => {
          
          const validSales = sales.filter((s: any) => s.classificationStatus !== "ignored");
          const ticketTotal = validSales.reduce((acc: number, sale: any) => acc + sale.totalAmount, 0);
          const ticketRevenue = validSales.filter((s: any) => s.countsAsRevenue).reduce((acc: number, sale: any) => acc + sale.totalAmount, 0);

          return (
            <div key={ticketNumber} className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
              {/* Ticket Header */}
              <div style={{ backgroundColor: "var(--surface-hover)", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                <span className="brand-font" style={{ fontSize: "1.1rem", color: "var(--text-soft)" }}>Ticket: <strong style={{color: "var(--primary)"}}>{ticketNumber}</strong></span>
                <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                   <div style={{ textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Suma Estricta: € {ticketTotal.toFixed(2)}
                   </div>
                   <div style={{ textAlign: "right", fontSize: "0.85rem", color: "var(--accent-foreground)", fontWeight: "600" }}>
                      Aporte Oficial Real: € {ticketRevenue.toFixed(2)}
                   </div>
                </div>
              </div>

              {/* Ticket Lines Table */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Estado</th>
                    <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Descripción</th>
                    <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em", textAlign: "right" }}>Base/IVA/Total</th>
                    <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em", textAlign: "right" }}>Efecto</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale: any) => {
                    const isIgnored = sale.classificationStatus === "ignored";
                    
                    return (
                    <tr key={sale.id} style={{ borderBottom: "1px solid var(--surface-hover)", opacity: isIgnored ? 0.5 : 1, backgroundColor: isIgnored ? "var(--surface)" : "transparent" }}>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "center", width: "5%" }}>
                        {isIgnored ? (
                          <span style={{color: "var(--warning)", fontWeight: "bold"}}>IGN.</span>
                        ) : sale.classificationStatus === "classified" ? (
                          <CheckCircle size={16} color="var(--success)" />
                        ) : (
                          <AlertTriangle size={16} color="var(--warning)" />
                        )}
                      </td>
                      <td style={{ padding: "1.25rem 2rem" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: "500", color: isIgnored ? "var(--text-muted)" : "var(--primary)", textDecoration: isIgnored ? "line-through" : "none" }}>{sale.description}</p>
                        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                            {isIgnored ? "Total/Fila Ignorada" : sale.classifiedType.replace("_", " ")} | 1 x {sale.quantity}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "right", width: "25%" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sale.baseAmount.toFixed(2)} / {sale.taxAmount.toFixed(2)} / </span>
                        <strong className="brand-font" style={{ fontSize: "1rem", color: "var(--primary)" }}>{sale.totalAmount.toFixed(2)}</strong>
                      </td>
                      <td style={{ padding: "1.25rem 2rem", textAlign: "right", width: "20%" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                          {sale.countsAsRevenue ? (
                            <span style={{ fontSize: "0.7rem", color: "var(--accent-foreground)", fontWeight: "600", border: "1px solid var(--accent-foreground)", padding: "0.15rem 0.5rem", borderRadius: "100px" }}>+ REVENUE ★</span>
                          ) : (
                            <span style={{ fontSize: "0.7rem", color: "var(--text-soft)", border: "1px solid var(--border)", padding: "0.15rem 0.5rem", borderRadius: "100px" }}>SIN REVENUE</span>
                          )}
                          
                          {sale.generatesVat ? (
                            <span style={{ fontSize: "0.65rem", color: "var(--success)" }}>+ IVA Creado</span>
                          ) : (
                            <span style={{ fontSize: "0.65rem", color: "var(--text-soft)" }}></span>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
