import { getEquipments } from "@/actions/equipment";
import EquipmentClient from "./EquipmentClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const response = await getEquipments();
  const equipments = response.success && response.data ? response.data : [];

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
          <ChevronLeft size={16} /> Volver a Ajustes
        </Link>
      </div>
      <h1 className="page-title brand-font">Aparatología</h1>
      <p className="page-subtitle">Gestiona los equipos físicos, su depreciación y asociación de tratamientos.</p>
      
      <EquipmentClient initialEquipments={equipments} />
    </div>
  );
}
