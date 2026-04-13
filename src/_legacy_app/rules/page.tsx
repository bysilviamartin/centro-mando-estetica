import prisma from "@/lib/prisma";
import RulesTable from "./RulesTable";
import { ListFilter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const rules = await prisma.classificationRule.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 className="page-title brand-font" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <ListFilter size={28} /> Reglas de Mapeo
      </h1>
      <p className="page-subtitle">Gestiona cómo el sistema interpreta automáticamente las descripciones de Koibox.</p>
      
      <div style={{ backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "3rem", borderLeft: "3px solid var(--accent-foreground)" }}>
        <h3 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--primary)" }}>¿Cómo funcionan las reglas?</h3>
        <ul style={{ fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "1.25rem", display: "grid", gap: "0.5rem" }}>
          <li>El importeador busca la <strong>Palabra Clave</strong> dentro de la descripción del ticket de Koibox.</li>
          <li>Si encuentra coincidencia, aplica automáticamente el <strong>Tipo Operativo</strong> y el <strong>Tratamiento Fiscal</strong> configurado.</li>
          <li>Puedes editar una regla, deshabilitarla para que deje de aplicarse, o eliminarla permanentemente.</li>
        </ul>
      </div>

      <RulesTable rules={rules} />
    </div>
  );
}
