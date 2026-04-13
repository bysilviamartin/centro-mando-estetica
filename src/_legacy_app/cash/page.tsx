import prisma from "@/lib/prisma";
import { Wallet, Info } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { ImportedMovement } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CashLedgerPage() {
  // Fetch raw movements from Koibox imports
  const movements = await prisma.importedMovement.findMany({
    orderBy: { date: 'desc' },
    take: 100, // Limit for V1
    include: {
      importSession: true
    }
  });

  // Calculate quick totals for today's money movements (not sales revenue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysMovements = await prisma.importedMovement.findMany({
    where: {
      date: { gte: today }
    }
  });

  const cashTodayIn = todaysMovements
    .filter((m: ImportedMovement) => m.type === 'ingreso' && m.paymentMethod?.toLowerCase().includes('efectivo'))
    .reduce((sum: number, m: ImportedMovement) => sum + m.amount, 0);

  const cardTodayIn = todaysMovements
    .filter((m: ImportedMovement) => m.type === 'ingreso' && m.paymentMethod?.toLowerCase().includes('tarjeta'))
    .reduce((sum: number, m: ImportedMovement) => sum + m.amount, 0);
    
  // Other payment methods (Volveremos, Bizum, Transf)
  const otherTodayIn = todaysMovements
    .filter((m: ImportedMovement) => m.type === 'ingreso' && !m.paymentMethod?.toLowerCase().includes('efectivo') && !m.paymentMethod?.toLowerCase().includes('tarjeta'))
    .reduce((sum: number, m: ImportedMovement) => sum + m.amount, 0);

  return (
    <div>
      <h1 className="page-title brand-font" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Wallet size={28} /> Actividad Diaria y Cajas
      </h1>
      <p className="page-subtitle">Visualiza los flujos brutos de dinero importados de los partes de Movimientos.</p>

      {/* Info Banner explaining conceptual separation */}
      <div style={{ backgroundColor: "rgba(201, 168, 130, 0.1)", border: "1px solid var(--accent)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <Info size={24} style={{ color: "var(--accent)" }} />
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--primary)", marginBottom: "0.5rem" }}>¿Por qué difieren estos números del Dashboard de Ventas?</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", lineHeight: "1.5" }}>
            Esta pantalla rastrea el <strong>recorrido del dinero físico/bancario</strong> (La Tesorería), NO la venta oficial. <br/>
            Por ejemplo, si un servicio cuesta 100€ (Venta Dashboard) pero el cliente paga 80€ hoy y 20€ Mañana, aquí verás la entrada de dinero en el día exacto en el que ocurrió, separada por método de pago.
          </p>
        </div>
      </div>

      {/* Quick Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="editorial-panel">
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "1rem" }}>Efectivo (Hoy)</h3>
          <p className="brand-font" style={{ fontSize: "2rem", color: "var(--foreground)" }}>{formatCurrency(cashTodayIn)}</p>
        </div>
        <div className="editorial-panel">
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "1rem" }}>Tarjeta (Hoy)</h3>
          <p className="brand-font" style={{ fontSize: "2rem", color: "var(--foreground)" }}>{formatCurrency(cardTodayIn)}</p>
        </div>
        <div className="editorial-panel">
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "1rem" }}>Otros Métodos (Ayer/Hoy)</h3>
          <p className="brand-font" style={{ fontSize: "2rem", color: "var(--foreground)" }}>{formatCurrency(otherTodayIn)}</p>
        </div>
      </div>

      {/* Raw Ledger */}
      <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-hover)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="brand-font" style={{ fontSize: "1.25rem", color: "var(--foreground)" }}>Histórico Importado (Movimientos)</h2>
        </div>
        
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", opacity: 0.7 }}>
              <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Fecha</th>
              <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Tipo</th>
              <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Descripción / Cliente</th>
              <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Método de Pago</th>
              <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase", textAlign: "right" }}>Importe Físico</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Sube un Excel de "Movimientos" para ver los flujos de tesorería importados.</td></tr>
            ) : (
              movements.map((mov: ImportedMovement) => (
                <tr key={mov.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>{new Date(mov.date).toLocaleDateString("es-ES")}</td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", textTransform: "capitalize" }}>
                    <span style={{ color: mov.type.toLowerCase() === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                      {mov.type}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={mov.description}>
                    {mov.description}
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                    <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--surface-hover)", fontSize: "0.75rem" }}>
                      {mov.paymentMethod || "Desconocido"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.95rem", textAlign: "right", fontWeight: "600", color: mov.type.toLowerCase() === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                    {mov.type.toLowerCase() === 'gasto' ? '-' : ''}{formatCurrency(mov.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
