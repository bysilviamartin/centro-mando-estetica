import prisma from "@/lib/prisma";
import { AlertTriangle, Check, BookPlus } from "lucide-react";
import { revalidatePath } from "next/cache";
import ReviewTable from "./ReviewTable";

export default async function ReviewPage() {
  const pendingMovements = await prisma.importedSale.findMany({
    where: { classificationStatus: "pending_review" },
    orderBy: [{ date: "desc" }, { ticketNumber: "asc" }],
    take: 50
  });

  return (
    <div>
      <h1 className="page-title brand-font">Movimientos Pendientes</h1>
      <p className="page-subtitle">Enséñale al sistema cómo clasificar e interpretar fiscalmente estos registros.</p>

      {pendingMovements.length === 0 ? (
        <div className="editorial-panel" style={{ textAlign: "center", padding: "4rem" }}>
          <Check size={48} color="var(--success)" style={{ margin: "0 auto 1.5rem auto" }} />
          <h2 className="brand-font" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>¡Todo al día!</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No hay movimientos importados pendientes de revisión o clasificación fiscal.</p>
        </div>
      ) : (
        <div className="editorial-panel" style={{ padding: "0" }}>
          
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--warning)", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "500" }}>
               <AlertTriangle size={16} /> {pendingMovements.length} movimientos requieren tu atención
            </span>
          </div>

          <ReviewTable pendingMovements={pendingMovements} />
        </div>
      )}
    </div>
  );
}
