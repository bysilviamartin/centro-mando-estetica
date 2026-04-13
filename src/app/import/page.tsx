import prisma from "@/lib/prisma";
import ImportUploader from "./ImportUploader";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Database, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sessionsRaw = await prisma.importSession.findMany({
    orderBy: { uploadDate: 'desc' },
    take: 10
  });

  // Calculate detailed stats per session
  const sessions = await Promise.all(sessionsRaw.map(async (s: any) => {
    if (s.fileType === "ventas") {
      const all = await prisma.importedSale.findMany({ where: { importSessionId: s.id } });
      const valid = all.filter((m: any) => m.classificationStatus !== "ignored");
      
      return {
        ...s,
        sumAmount: valid.reduce((acc: number, m: any) => acc + m.totalAmount, 0),
        sumSaleAmount: valid.reduce((acc: number, m: any) => acc + m.baseAmount, 0),
        sumSaleTax: valid.reduce((acc: number, m: any) => acc + m.taxAmount, 0),
        classifiedCount: valid.filter((m: any) => m.classificationStatus === "classified").length,
        pendingCount: valid.filter((m: any) => m.classificationStatus === "pending_review").length,
        revenueCount: valid.filter((m: any) => m.countsAsRevenue).length,
        vatCount: valid.filter((m: any) => m.generatesVat).length,
        clientNameCount: 0,
        serviceSegmentCount: 0,
        productSegmentCount: 0,
        isVentas: true,
      };
    } else {
      const all = await prisma.importedMovement.findMany({ where: { importSessionId: s.id } });
      return {
        ...s,
        sumAmount: all.reduce((acc: number, m: any) => acc + m.amount, 0),
        sumSaleAmount: 0,
        sumSaleTax: 0,
        classifiedCount: 0,
        pendingCount: 0,
        revenueCount: 0,
        vatCount: 0,
        clientNameCount: 0,
        serviceSegmentCount: 0,
        productSegmentCount: 0,
        isVentas: false,
      };
    }
  }));

  return (
    <div>
      <h1 className="page-title brand-font">Importaciones & Validación</h1>
      <p className="page-subtitle">Carga archivos Excel (Koibox) y verifica la integridad de los datos importados.</p>

      {/* Guide explanation requested by user */}
      <div style={{ backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "3rem", borderLeft: "3px solid var(--accent-foreground)" }}>
        <h3 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--primary)" }}>Guía de Métricas de Integridad</h3>
        <ul style={{ fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "1.25rem", display: "grid", gap: "0.5rem" }}>
          <li><strong>Total Movimientos:</strong> Filas crudas del Excel.</li>
          <li><strong>Filas Válidas Ingresadas:</strong> Ítems de venta real procesados correctamente.</li>
          <li><strong style={{ color: "var(--warning)" }}>Filas Ignoradas:</strong> Filas marcadas como ignoradas (basura, subtotales). Se guardan para auditoría pero no suman en las métricas.</li>
          <li><strong>Σ Importe Real:</strong> Sumatoria financiera directa de TODAS las líneas válidas de este Excel. ¡Compáralo con el total del ticket en papel!</li>
          <li><strong>Ingreso Fiscal Real (Counts As Revenue):</strong> Filas de venta que suman valor a la empresa. Ignora consumos de bonos y ajustes.</li>
          <li><strong>Ventas que Generan IVA (Generates VAT):</strong> Filas que incrementan la reserva obligatoria fiscal.</li>
          <li><strong>Pendientes:</strong> Filas válidas pero huérfanas de regla. <em>No afectarán a los ingresos del Dashboard hasta ser mapeadas.</em></li>
        </ul>
      </div>

      <ImportUploader />

      <h2 className="brand-font" style={{ fontSize: "1.5rem", marginTop: "3rem", marginBottom: "1.5rem" }}>Historial de Sesiones</h2>
      
      {sessions.length === 0 ? (
        <div className="editorial-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-soft)" }}>No hay importaciones registradas.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {sessions.map((s: any) => (
            <div key={s.id} className="editorial-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="brand-font" style={{ fontSize: "1.25rem", color: "var(--primary)" }}>{s.filename}</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", fontFamily: "monospace", marginTop: "0.25rem" }}>ID: {s.id} | {s.uploadDate.toLocaleString("es-ES")}</p>
                </div>
                <span style={{ 
                  backgroundColor: s.status === "success" ? "var(--success-bg)" : "var(--warning-bg)",
                  color: s.status === "success" ? "var(--success)" : "var(--warning)",
                  padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase"
                }}>
                  {s.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                {/* Financial Totals */}
                <div>
                  <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-soft)", marginBottom: "0.5rem" }}><Database size={12} style={{display: "inline", marginRight: "0.25rem"}}/> Sumas Financieras</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <li style={{display: "flex", justifyContent: "space-between"}}><span>Σ Importe Real:</span> <strong className="brand-font">€ {s.sumAmount.toFixed(2)}</strong></li>
                    <li style={{display: "flex", justifyContent: "space-between"}}><span>Σ Importe Venta:</span> <strong className="brand-font">€ {s.sumSaleAmount.toFixed(2)}</strong></li>
                    <li style={{display: "flex", justifyContent: "space-between"}}><span>Σ Imp. IVA:</span> <strong className="brand-font" style={{color: "var(--text-muted)"}}>€ {s.sumSaleTax.toFixed(2)}</strong></li>
                  </ul>
                </div>

                {/* Classification Status */}
                {s.isVentas && (
                  <div>
                    <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Clasificación Operativa</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <li style={{display: "flex", justifyContent: "space-between"}}><span>Ventas Válidas:</span> <strong>{s.rowsProcessed} filas</strong></li>
                      <li style={{display: "flex", justifyContent: "space-between"}}><span>Ignoradas (Totales):</span> <strong style={{color: s.rowsIgnored > 0 ? "var(--warning)" : "var(--text-soft)"}}>{s.rowsIgnored} filas</strong></li>
                      <li style={{display: "flex", justifyContent: "space-between"}}><span>Clasificadas (OK):</span> <strong style={{color: "var(--success)"}}>{s.classifiedCount}</strong></li>
                      <li style={{display: "flex", justifyContent: "space-between"}}><span>Pendientes Revisión:</span> <strong style={{color: s.pendingCount > 0 ? "var(--warning)" : "var(--success)"}}>{s.pendingCount}</strong></li>
                    </ul>
                  </div>
                )}

                {/* Fiscal Flags and Audit */}
                {s.isVentas && (
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Tratamiento Fiscal</h4>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <li style={{display: "flex", justifyContent: "space-between", color: "var(--primary)"}}><span>Cuenta como Ingreso:</span> <strong>{s.revenueCount} filas</strong></li>
                        <li style={{display: "flex", justifyContent: "space-between", color: "var(--primary)"}}><span>Genera IVA Oficial:</span> <strong>{s.vatCount} filas</strong></li>
                      </ul>
                    </div>
                    <Link href={`/import/audit/${s.id}`} style={{
                      marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em",
                      color: "var(--accent-foreground)", border: "1px solid var(--accent-foreground)",
                      padding: "0.5rem 1rem", borderRadius: "100px", textDecoration: "none", alignSelf: "flex-start",
                      fontFamily: "var(--font-montserrat)", fontWeight: "600",
                    }}>
                      <Search size={14} /> Auditoría de Tickets
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
