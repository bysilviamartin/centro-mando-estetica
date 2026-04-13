"use client";

import { useState } from "react";
import { Activity, Package, DollarSign, Percent, History, Save, Tag, Hash, FileText, Truck, Calendar, Sparkles } from "lucide-react";
import { updateCabinaProduct, adjustCabinaStock } from "@/actions/cabina-products";

export default function CabinaProductDetailsClient({ initialProduct }: { initialProduct: any }) {
  const [product, setProduct] = useState(initialProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<number | "">("");

  async function handleFieldChange(field: string, value: any) {
    setProduct((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    const res = await updateCabinaProduct(product.id, {
      reference: product.reference,
      name: product.name,
      capacity: product.capacity,
      supplier: product.supplier,
      costPrice: parseFloat(product.costPrice?.toString() || "0"),
      vat: parseFloat(product.vat?.toString() || "21"),
    });
    
    if (res.success && res.data) {
      alert("Producto guardado correctamente.");
    } else {
      alert("Error al guardar: " + res.error);
    }
    setIsSaving(false);
  }

  async function handleAdjustStock() {
    if (stockAdjustment === "" || isNaN(Number(stockAdjustment))) return;
    const qty = Number(stockAdjustment);
    if (qty === 0) return;
    
    const desc = prompt("Motivo del ajuste de cabina (opcional):", qty > 0 ? "Entrada manual a cabina" : "Merma / Uso extraordinario manual");
    
    setIsSaving(true);
    const res = await adjustCabinaStock(product.id, qty, desc || "Ajuste manual de cabina");
    
    if (res.success) {
      setProduct((prev: any) => ({ 
        ...prev, 
        stock: prev.stock + qty,
        stockMovements: [
          {
            id: 'temp-' + Date.now(),
            date: new Date(),
            type: "manual_adjustment",
            quantity: qty,
            description: desc || "Ajuste manual de cabina"
          },
          ...(prev.stockMovements || [])
        ].slice(0, 10)
      }));
      setStockAdjustment("");
    } else {
      alert("Error actualizando stock de cabina: " + res.error);
    }
    setIsSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* BLOQUE IDENTIFICACIÓN */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Tag size={18} /> Identificación (Cabina)
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Referencia</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", opacity: 0.7 }}>
              <Hash size={16} color="var(--text-soft)" />
              <input type="text" value={product.reference || ""} readOnly style={{ border: "none", background: "transparent", color: "var(--text-soft)", fontSize: "0.9rem", width: "100%", outline: "none" }} />
            </div>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del Producto</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <FileText size={16} color="var(--text-soft)" />
              <input type="text" value={product.name} onChange={(e) => handleFieldChange("name", e.target.value)} style={{ border: "none", background: "transparent", color: "var(--foreground)", fontSize: "0.9rem", width: "100%", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Capacidad (Format)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Package size={16} color="var(--text-soft)" />
              <input type="text" value={product.capacity || ""} onChange={(e) => handleFieldChange("capacity", e.target.value)} style={{ border: "none", background: "transparent", color: "var(--foreground)", fontSize: "0.9rem", width: "100%", outline: "none" }} placeholder="Ej. 500 ML" />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Proveedor</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Truck size={16} color="var(--text-soft)" />
              <input type="text" value={product.supplier || ""} onChange={(e) => handleFieldChange("supplier", e.target.value)} style={{ border: "none", background: "transparent", color: "var(--foreground)", fontSize: "0.9rem", width: "100%", outline: "none" }} placeholder="Ej. SkinIdent Cabina" />
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE FINANCIERO E IMPUESTOS */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DollarSign size={18} /> Costes e Importes
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de compra</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", opacity: 0.7 }}>
              <Calendar size={16} color="var(--text-soft)" />
              <input type="text" value={"—"} readOnly style={{ border: "none", background: "transparent", color: "var(--text-soft)", fontSize: "0.9rem", width: "100%", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>P. Compra (Sin IVA)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem",  borderLeft: "2px solid var(--primary)" }}>
              <span style={{ color: "var(--text-soft)", fontWeight: 600 }}>€</span>
              <input type="number" step="0.01" value={product.costPrice} onChange={(e) => handleFieldChange("costPrice", parseFloat(e.target.value) || 0)} style={{ border: "none", background: "transparent", color: "var(--foreground)", fontSize: "0.9rem", width: "100%", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>% IVA</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem" }}>
              <Percent size={16} color="var(--text-soft)" />
              <select value={product.vat} onChange={(e) => handleFieldChange("vat", parseFloat(e.target.value))} style={{ border: "none", background: "transparent", color: "var(--foreground)", fontSize: "0.9rem", width: "100%", outline: "none", appearance: "none" }}>
                <option value={21}>21%</option>
                <option value={10}>10%</option>
                <option value={4}>4%</option>
                <option value={0}>0%</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>PVP (Venta Cliente)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", opacity: 0.7 }}>
              <span style={{ color: "var(--text-soft)", fontWeight: 600 }}>€</span>
              <input type="text" value={"0.00 (Uso Cabina)"} readOnly style={{ border: "none", background: "transparent", color: "var(--text-soft)", fontSize: "0.9rem", width: "100%", outline: "none" }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSave} disabled={isSaving} className="primary-button" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}>
            <Save size={16} /> {isSaving ? "Guardando..." : "Guardar Ficha"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* BLOQUE STOCK Y AJUSTE */}
        <div className="editorial-panel" style={{ padding: "1.5rem" }}>
          <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} /> Control de Stock (Cabina)
          </h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
            <div style={{ 
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: "120px", height: "120px", borderRadius: "50%", 
              backgroundColor: product.stock > 0 ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)",
              border: `4px solid ${product.stock > 0 ? "#22c55e" : "#ef4444"}`
            }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 700, color: product.stock > 0 ? "#22c55e" : "#ef4444", lineHeight: 1 }}>{product.stock}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.25rem", fontWeight: 600 }}>Unidades</span>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.5rem" }}>Ajuste Rápido de Stock</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-soft)", marginBottom: "1rem" }}>Utiliza valores positivos para sumar (ej. 5) o negativos para restar consumos (ej. -2).</p>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input 
                  type="number" 
                  value={stockAdjustment}
                 onChange={(e) => setStockAdjustment(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Cantidad (+/-)"
                  style={{ 
                    flex: 1, padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", 
                    border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", fontSize: "0.9rem"
                  }}
                />
                <button 
                  onClick={handleAdjustStock}
                  disabled={isSaving || stockAdjustment === ""}
                  style={{ 
                    padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary)", color: "black", border: "none", cursor: stockAdjustment === "" ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9rem", opacity: stockAdjustment === "" ? 0.5 : 1
                  }}
                >
                  Aplicar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE TRATAMIENTOS (VISUAL PLACEHOLDER) */}
        <div className="editorial-panel" style={{ padding: "1.5rem" }}>
          <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} /> Tratamientos Asociados
          </h2>
          <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Sparkles size={24} color="var(--text-muted)" />
            <div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-soft)", fontWeight: 500 }}>Funcionalidad en desarrollo</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Próximamente podrás ver en qué protocolos y escandallos se consume este producto.</p>
            </div>
          </div>
        </div>

      </div>

      {/* BLOQUE HISTÓRICO DE MOVIMIENTOS */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={18} /> Últimos Movimientos
        </h2>
        
        <div className="table-container">
          <table className="editorial-table">
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Fecha</th>
                <th style={{ width: "30%" }}>Tipo Operación</th>
                <th style={{ width: "30%" }}>Descripción</th>
                <th style={{ textAlign: "right", width: "20%" }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {(!product.stockMovements || product.stockMovements.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No hay movimientos registrados para este producto de cabina.
                  </td>
                </tr>
              ) : (
                product.stockMovements.map((mov: any) => {
                  const isPositive = mov.quantity > 0;
                  
                  let typeLabel = mov.type;
                  if (mov.type === "import_initial") typeLabel = "Importación Inicial";
                  else if (mov.type === "manual_adjustment") typeLabel = "Ajuste Manual";
                  else if (mov.type === "sale") typeLabel = "Venta"; // Fallback though technically cabina shouldn't sell directly.

                  return (
                    <tr key={mov.id}>
                      <td style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>
                        {new Date(mov.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "0.85rem" }}>
                        {typeLabel}
                      </td>
                      <td style={{ color: "var(--text-soft)", fontSize: "0.85rem", fontStyle: "italic" }}>
                        {mov.description || "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "0.25rem", 
                          fontSize: "0.85rem", 
                          fontWeight: 600,
                          backgroundColor: isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: isPositive ? "#22c55e" : "#ef4444"
                        }}>
                          {isPositive ? "+" : ""}{mov.quantity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
