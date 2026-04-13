import { getProductById } from "@/actions/products";
import ProductDetailsClient from "./ProductDetailsClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const req = await getProductById(id);
  
  if (!req.success || !req.data) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/settings/products" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
          <ChevronLeft size={16} /> Volver a Productos de Venta
        </Link>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title brand-font">{req.data.name}</h1>
          <p className="page-subtitle">Gestiona la ficha del producto, precios e inventario.</p>
        </div>
      </div>

      <ProductDetailsClient initialProduct={req.data} />
    </div>
  );
}
