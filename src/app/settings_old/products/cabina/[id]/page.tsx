import { getCabinaProductById } from "@/actions/cabina-products";
import CabinaProductDetailsClient from "./CabinaProductDetailsClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CabinaProductPage({ params }: { params: { id: string } }) {
  const req = await getCabinaProductById(params.id);

  if (!req.success || !req.data) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        <h2>Producto cabina no encontrado.</h2>
        <Link href="/settings/products/cabina" className="text-[var(--primary)] underline mt-4 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  const product = req.data;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/settings/products/cabina" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
          <ChevronLeft size={16} /> Volver a Productos Cabina
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title brand-font">Ficha de Producto de Cabina</h1>
          <p className="page-subtitle">{product.name}</p>
        </div>
      </div>

      <CabinaProductDetailsClient initialProduct={product} />
    </div>
  );
}
