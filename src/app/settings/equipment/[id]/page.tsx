import { getEquipmentById, getEquipmentProfitabilitySales } from "@/actions/equipment";
import { getServices } from "@/actions/services";
import EquipmentDetailsClient from "./EquipmentDetailsClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reqEq = await getEquipmentById(id);
  
  if (!reqEq.success || !reqEq.data) {
    notFound();
  }

  const reqSvc = await getServices();
  const allServices = reqSvc.success && reqSvc.data ? reqSvc.data : [];

  const reqSales = await getEquipmentProfitabilitySales(id);
  const equipmentSales = reqSales.success && reqSales.data ? reqSales.data : [];

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/settings/equipment" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
          <ChevronLeft size={16} /> Volver a Aparatología
        </Link>
      </div>
      
      <h1 className="page-title brand-font">{reqEq.data.name}</h1>
      <p className="page-subtitle">Gestiona la ficha de rentabilidad y sus tratamientos asociados.</p>

      <div style={{ marginTop: "2rem" }}>
        <EquipmentDetailsClient 
          initialEquipment={reqEq.data} 
          allServices={allServices}
          equipmentSales={equipmentSales}
        />
      </div>
    </div>
  );
}
