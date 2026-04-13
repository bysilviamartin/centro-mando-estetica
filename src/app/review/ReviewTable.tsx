"use client";

import { useState, useEffect } from "react";
import { BookPlus } from "lucide-react";
import MappingModal from "./MappingModal";

export default function ReviewTable({ pendingMovements }: { pendingMovements: any[] }) {
  const [movements, setMovements] = useState(pendingMovements);
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);

  // Sync state if props change (revalidation)
  useEffect(() => {
    setMovements(pendingMovements);
  }, [pendingMovements]);

  // Group sales by Ticket Number
  const groupedTickets = movements.reduce((acc: Record<string, any[]>, mov: any) => {
    const tnum = mov.ticketNumber || "SIN TICKET";
    if (!acc[tnum]) acc[tnum] = [];
    acc[tnum].push(mov);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Agrupado por Ticket (Comprobante). Mapea cada línea a su clasificación correspondiente.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {Object.entries(groupedTickets).map(([ticketNumber, sales]: [string, any[]]) => (
          <div key={ticketNumber} style={{ borderBottom: "1px solid var(--border)" }}>
            
            {/* Ticket Header */}
            <div style={{ backgroundColor: "var(--surface-hover)", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="brand-font" style={{ fontSize: "0.9rem", color: "var(--text-soft)" }}>Ticket: <strong style={{color: "var(--primary)"}}>{ticketNumber}</strong></span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{sales.length} línea{sales.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Ticket Lines */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {sales.map((mov: any) => (
                  <tr key={mov.id} style={{ borderBottom: "1px solid var(--surface-hover)" }}>
                    <td style={{ padding: "1.25rem 2rem", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap", width: "12%" }}>
                      {new Date(mov.date).toLocaleDateString("es-ES")}
                    </td>
                    <td style={{ padding: "1.25rem 2rem" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--primary)" }}>
                        {mov.description}
                      </p>
                      <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "1rem" }}>
                        <span>Cant: {mov.quantity}</span>
                        <span>Base: €{mov.baseAmount.toFixed(2)}</span>
                        <span>IVA: €{mov.taxAmount.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="brand-font" style={{ padding: "1.25rem 2rem", fontSize: "1rem", textAlign: "right", color: "var(--primary)", width: "15%" }}>
                      € {mov.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: "1.25rem 2rem", textAlign: "center", width: "20%" }}>
                        <button 
                        onClick={() => setSelectedMovement(mov)}
                        style={{ 
                          backgroundColor: "transparent", color: "var(--accent-foreground)", 
                          border: "1px solid var(--accent-foreground)", padding: "0.5rem 1rem", 
                          fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em",
                          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem",
                          fontFamily: "var(--font-montserrat)", borderRadius: "var(--radius-sm)"
                        }}>
                          <BookPlus size={14} /> Mapear Línea
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {selectedMovement && (
        <MappingModal 
          movement={selectedMovement} 
          onClose={() => setSelectedMovement(null)} 
          onSuccess={() => {
            // Remove the mapped row (and identically described peers) from sight instantly
            setMovements(prev => prev.filter(m => m.description !== selectedMovement.description));
            setSelectedMovement(null);
          }}
        />
      )}
    </>
  );
}
