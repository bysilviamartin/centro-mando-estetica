"use client";

import { useState } from "react";
import { Activity, Package, DollarSign, Percent, History, Save, Tag, Hash, RefreshCcw, FileText, Trash2, Truck } from "lucide-react";
import { updateProduct, adjustProductStock, deleteProduct } from "@/actions/products";
import { useRouter } from "next/navigation";

export default function ProductDetailsClient({ initialProduct }: { initialProduct: any }) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<number | "">("");

  // Extracción dinámica de marca y nombre si viene con estructura MARCA | LINEA | NOMBRE
  let derivedBrand = "";
  let derivedName = product.name || "";
  if (product.name && product.name.includes("|")) {
    const parts = product.name.split("|").map((s: string) => s.trim());
    if (parts.length >= 3) {
      derivedBrand = parts[0];
      derivedName = parts.slice(2).join(" | ");
    }
  }

  // Handler generales para Block 1 y Block 2
  async function handleFieldChange(field: string, value: any) {
    setProduct((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    const res = await updateProduct(product.id, {
      reference: product.reference,
      name: product.name,
      line: product.line,
      capacity: product.capacity,
      supplier: product.supplier,
      costPrice: parseFloat(product.costPrice?.toString() || "0"),
      vat: parseFloat(product.vat?.toString() || "21"),
      salePrice: parseFloat(product.salePrice?.toString() || "0"),
      minimumStock: parseInt(product.minimumStock?.toString() || "0", 10),
      active: product.active
    });
    
    if (res.success) {
      alert("Producto guardado correctamente.");
    } else {
      alert("Error al guardar: " + res.error);
    }
    setIsSaving(false);
  }

  // Stock Adjustment (Block 3)
  async function handleAdjustStock() {
    if (stockAdjustment === "" || isNaN(Number(stockAdjustment))) return;
    const qty = Number(stockAdjustment);
    if (qty === 0) return;
    
    const desc = prompt("Motivo del ajuste de stock (opcional):", qty > 0 ? "Suma manual" : "Resta / merma manual");
    
    setIsSaving(true);
    const res = await adjustProductStock(product.id, qty, desc || "Ajuste manual");
    
    if (res.success && res.data) {
      setProduct(res.data);
      setStockAdjustment("");
    } else {
      alert("Error actualizando stock: " + res.error);
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.\n\nSi el producto tiene ventas o movimientos, la eliminación fallará y deberás desactivarlo.")) return;
    
    setIsDeleting(true);
    const res = await deleteProduct(product.id);
    if (res.success) {
      router.push("/settings/products");
    } else {
      alert("Error: " + res.error);
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* BLOQUE 1 — IDENTIFICACIÓN */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Tag size={18} /> Identificación
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Referencia</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Hash size={16} color="var(--text-soft)" />
              <input 
                type="text" 
                value={product.reference || ""}
                onChange={(e) => handleFieldChange("reference", e.target.value)}
                placeholder="Código único"
                style={{ border: "none", backgroundColor: "transparent", width: "100%", color: "var(--foreground)", fontFamily: "monospace", fontSize: "0.95rem", outline: "none" }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Marca</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Tag size={16} color="var(--text-soft)" />
              <input 
                type="text" 
                value={derivedBrand}
                disabled
                title="Extraído automáticamente del nombre si contiene '|'"
                placeholder="-"
                style={{ border: "none", backgroundColor: "transparent", width: "100%", color: "var(--text-soft)", fontSize: "0.95rem", outline: "none", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Línea / Gama</label>
            <input 
              type="text" 
              value={product.line || ""}
              onChange={(e) => handleFieldChange("line", e.target.value)}
              placeholder="Ej: Anti-Aging"
              style={{ width: "100%", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del Producto</label>
            <input 
              type="text" 
              value={product.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Ej: Crema Facial Hidratante"
              style={{ width: "100%", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "var(--foreground)", fontSize: "1rem", outline: "none" }}
            />
            {derivedBrand && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                <span style={{ fontWeight: 600 }}>Nombre Extraído:</span> {derivedName}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Capacidad</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Package size={16} color="var(--text-soft)" />
              <input 
                type="text" 
                value={product.capacity || ""}
                onChange={(e) => handleFieldChange("capacity", e.target.value)}
                placeholder="Ej: 50ml, 100g, 1L"
                style={{ border: "none", backgroundColor: "transparent", width: "100%", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Proveedor Principal</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Truck size={16} color="var(--text-soft)" />
              <input 
                type="text" 
                value={product.supplier || ""}
                onChange={(e) => handleFieldChange("supplier", e.target.value)}
                placeholder="Ej: Germaine de Capuccini"
                style={{ border: "none", backgroundColor: "transparent", width: "100%", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="primary-button" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: isSaving ? 0.7 : 1 }}
          >
            <Save size={16} /> Guardar Cambios Básicos
          </button>
        </div>
      </div>

      {/* BLOQUE 2 — INFORMACIÓN ECONÓMICA */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DollarSign size={18} /> Información Económica
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio Compra (Coste)</label>
            <div style={{ position: "relative" }}>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={product.costPrice || ""}
                onChange={(e) => handleFieldChange("costPrice", e.target.value)}
                style={{ width: "100%", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem 0.75rem 2.5rem", color: "var(--foreground)", fontFamily: "monospace", fontSize: "1rem", outline: "none" }}
              />
              <DollarSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>IVA</label>
            <div style={{ position: "relative" }}>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={product.vat || ""}
                onChange={(e) => handleFieldChange("vat", e.target.value)}
                style={{ width: "100%", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem 0.75rem 2.5rem", color: "var(--foreground)", fontFamily: "monospace", fontSize: "1rem", outline: "none" }}
              />
              <Percent size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio Venta (PVP)</label>
            <div style={{ position: "relative" }}>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={product.salePrice || ""}
                onChange={(e) => handleFieldChange("salePrice", e.target.value)}
                style={{ width: "100%", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem 0.75rem 2.5rem", color: "#10b981", fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 600, outline: "none" }}
              />
              <DollarSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#10b981" }} />
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
            * Estos datos pueden ser sobrescritos automáticamente al importar Tarifas de Proveedor.
          </p>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="primary-button" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: isSaving ? 0.7 : 1 }}
          >
            <Save size={16} /> Guardar Económicos
          </button>
        </div>
      </div>

      {/* BLOQUE 3 — STOCK */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Package size={18} /> Existencias Físicas
        </h2>

        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", backgroundColor: "var(--surface)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <div style={{ flex: "1 1 auto" }}>
            <span style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock Actual</span>
            <div style={{ fontSize: "2rem", color: "var(--foreground)", fontFamily: "monospace", fontWeight: 700 }}>
              {product.stock} <span style={{ fontSize: "1rem", color: "var(--text-soft)", fontWeight: 400 }}>ud.</span>
            </div>
          </div>

          <div style={{ flex: "1 1 auto", borderLeft: "1px solid var(--border)", paddingLeft: "2rem", minWidth: "150px" }}>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock Mínimo</label>
            <input 
              type="number" 
              value={product.minimumStock || ""}
              onChange={(e) => handleFieldChange("minimumStock", e.target.value)}
              placeholder="0"
              style={{ width: "100%", maxWidth: "120px", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "var(--foreground)", fontFamily: "monospace", fontSize: "1rem", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ajuste Rápido (+ / -)</label>
              <input 
                type="number" 
                placeholder="Ej: +5, -2..." 
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ width: "120px", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "var(--foreground)", fontFamily: "monospace", fontSize: "1rem", outline: "none", textAlign: "right" }}
              />
            </div>
            <button 
              onClick={handleAdjustStock}
              disabled={isSaving || stockAdjustment === ""}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--foreground)", color: "var(--background)", fontWeight: 600, border: "none", cursor: (isSaving || stockAdjustment === "") ? "not-allowed" : "pointer", opacity: (isSaving || stockAdjustment === "") ? 0.5 : 1 }}
            >
              <RefreshCcw size={16} /> Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE 4 — HISTÓRICO DE MOVIMIENTOS */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={18} /> Histórico de Movimientos
        </h2>

        {!product.stockMovements || product.stockMovements.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-soft)", backgroundColor: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
            No hay movimientos de stock registrados para este producto.
          </div>
        ) : (
          <div className="table-container">
            <table className="editorial-table" style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Fecha</th>
                  <th>Tipo / Motivo</th>
                  <th style={{ textAlign: "right", width: "100px" }}>Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {product.stockMovements.map((mov: any) => (
                  <tr key={mov.id}>
                    <td style={{ color: "var(--text-soft)" }}>
                      {new Date(mov.date).toLocaleDateString("es-ES")} <br/>
                      <span style={{ fontSize: "0.75rem" }}>{new Date(mov.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileText size={14} color="var(--text-muted)" />
                        <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{mov.type.replace(/_/g, " ").toUpperCase()}</span>
                      </div>
                      {mov.description && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-soft)", marginTop: "0.25rem", paddingLeft: "1.5rem" }}>
                          {mov.description}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 700, color: mov.quantity > 0 ? "#10b981" : mov.quantity < 0 ? "#ef4444" : "var(--text-soft)" }}>
                      {mov.quantity > 0 ? "+" : ""}{mov.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BLOQUE ELIMINAR */}
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ color: "#ef4444", fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>Zona de peligro</h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", maxWidth: "500px" }}>
            Eliminar permanentemente este producto. Solo puede eliminarse si no tiene un histórico de alteraciones de compras y ventas asociado a la caja. Ocultarlo usando la desactivación.
          </p>
        </div>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          style={{ 
            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", 
            borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", 
            fontWeight: 600, border: "1px solid rgba(239, 68, 68, 0.2)", cursor: isDeleting ? "not-allowed" : "pointer", 
            opacity: isDeleting ? 0.7 : 1, transition: "all 0.2s" 
          }}
        >
          <Trash2 size={16} /> {isDeleting ? "Eliminando..." : "Eliminar Producto"}
        </button>
      </div>

    </div>
  );
}
