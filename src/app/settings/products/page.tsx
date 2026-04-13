import { getProducts } from "@/actions/products";
import ProductsClient from "./ProductsClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const req = await getProducts();
  const products = req.success && req.data ? req.data : [];

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-soft)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
          <ChevronLeft size={16} /> Volver a Ajustes
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title brand-font">Productos de Venta</h1>
          <p className="page-subtitle">Gestiona el catálogo de productos disponibles para la venta.</p>
        </div>
      </div>

      <ProductsClient initialProducts={products} />
    </div>
  );
}
