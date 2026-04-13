import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { createExpense, updateExpense } from "@/actions/expenses";
import DocumentInput, { DocumentEntry } from "@/components/DocumentInput";

export default function ExpenseModal({ isOpen, onClose, accounts, categories, suppliers = [], initialData = null }: { isOpen: boolean, onClose: () => void, accounts: any[], categories: any[], suppliers?: any[], initialData?: any }) {
  const [formData, setFormData] = useState({
    expenseCategoryId: categories[0]?.id || "",
    description: "",
    totalAmount: "",
    taxTreatment: "with_tax",
    taxRate: "0.21",
    taxDeductible: true,
    invoiceDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(), "yyyy-MM-dd"),
    paidDate: "",
    paymentStatus: "pending",
    treasuryAccountId: accounts[0]?.id || "",
    supplierId: "",
    newSupplierName: "",
    documents: [] as DocumentEntry[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      let initialTaxTreatment = "with_tax";
      let deducedRate = "0.21";
      if (initialData.baseAmount && initialData.totalAmount) {
         if (initialData.taxAmount === 0 || initialData.baseAmount === initialData.totalAmount) {
             initialTaxTreatment = "without_tax";
         } else {
             const calculatedRatio = initialData.totalAmount / initialData.baseAmount;
             if (Math.abs(calculatedRatio - 1.10) < 0.05) {
                deducedRate = "0.10";
             }
         }
      }

      setFormData({
        expenseCategoryId: initialData.expenseCategoryId || categories[0]?.id || "",
        description: initialData.description || "",
        totalAmount: initialData.totalAmount ? String(initialData.totalAmount) : "",
        taxTreatment: initialTaxTreatment,
        taxRate: deducedRate,
        taxDeductible: initialData.taxDeductible !== undefined ? initialData.taxDeductible : true,
        invoiceDate: initialData.invoiceDate ? format(new Date(initialData.invoiceDate), "yyyy-MM-dd") : (initialData.dueDate ? format(new Date(initialData.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")),
        dueDate: initialData.dueDate ? format(new Date(initialData.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        paidDate: initialData.paidDate ? format(new Date(initialData.paidDate), "yyyy-MM-dd") : "",
        paymentStatus: initialData.paymentStatus || "pending",
        treasuryAccountId: initialData.treasuryAccountId || accounts[0]?.id || "",
        supplierId: initialData.supplierId || "",
        newSupplierName: "",
        documents: initialData.documents ? initialData.documents.map((d:any) => ({ name: d.name, url: d.url })) : []
      });
    } else {
      // Reset
      setFormData({
        expenseCategoryId: categories[0]?.id || "",
        description: "",
        totalAmount: "",
        taxTreatment: "with_tax",
        taxRate: "0.21",
        taxDeductible: true,
        invoiceDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(new Date(), "yyyy-MM-dd"),
        paidDate: "",
        paymentStatus: "pending",
        treasuryAccountId: accounts[0]?.id || "",
        supplierId: "",
        newSupplierName: "",
        documents: [],
      });
    }
  }, [initialData, categories, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isNoTax = formData.taxTreatment === "without_tax";
    const total = parseFloat(formData.totalAmount) || 0;
    const rate = isNoTax ? 0 : (parseFloat(formData.taxRate) || 0.21);
    const baseAmount = isNoTax ? total : parseFloat((total / (1 + rate)).toFixed(2));
    const taxAmount = isNoTax ? 0 : parseFloat((total - baseAmount).toFixed(2));

    const payload = {
      ...formData,
      supplierId: formData.supplierId === "NEW" && formData.newSupplierName.trim() ? `NEW:${formData.newSupplierName.trim()}` : formData.supplierId,
      taxDeductible: isNoTax ? false : formData.taxDeductible,
      baseAmount: baseAmount,
      taxAmount: taxAmount,
      totalAmount: total,
      invoiceDate: formData.invoiceDate,
    };

    let res;
    if (initialData?.id) {
       res = await updateExpense(initialData.id, payload);
    } else {
       res = await createExpense(payload);
    }
    
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      alert("Error: " + res.error);
    }
  };

  const isNoTaxUI = formData.taxTreatment === "without_tax";
  const numericTotal = parseFloat(formData.totalAmount) || 0;
  const numericRate = isNoTaxUI ? 0 : (parseFloat(formData.taxRate) || 0.21);
  const computedBase = isNoTaxUI ? numericTotal.toFixed(2) : (numericTotal / (1 + numericRate)).toFixed(2);
  const computedTax = isNoTaxUI ? "0.00" : (numericTotal - (numericTotal / (1 + numericRate))).toFixed(2);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "100%", maxWidth: "600px", margin: "1rem", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 className="brand-font" style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--foreground)" }}>{initialData ? "Editar Gasto / Factura" : "Nuevo Gasto / Factura"}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Fecha de Factura *</label>
              <input 
                type="date" 
                required 
                value={formData.invoiceDate} 
                onChange={e => setFormData({...formData, invoiceDate: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Categoría *</label>
              <select 
                required 
                value={formData.expenseCategoryId} 
                onChange={e => setFormData({...formData, expenseCategoryId: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Descripción *</label>
              <input 
                type="text" 
                required 
                placeholder="Ej: Material desechable facial"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Proveedor (Opcional)</label>
              
              {formData.supplierId === "NEW" ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    placeholder="Nombre del nuevo proveedor..."
                    value={formData.newSupplierName} 
                    onChange={e => setFormData({...formData, newSupplierName: e.target.value})} 
                    style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, supplierId: "", newSupplierName: ""})}
                    className="btn-secondary"
                    style={{ padding: "0 1rem" }}
                  >
                    X
                  </button>
                </div>
              ) : (
                <select 
                  value={formData.supplierId} 
                  onChange={e => setFormData({...formData, supplierId: e.target.value})} 
                  style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  <option value="NEW" style={{ fontWeight: "bold", color: "var(--primary)" }}>➕ Añadir Nuevo Proveedor...</option>
                  {suppliers.map((sup: any) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Tratamiento IVA *</label>
              <select 
                required 
                value={formData.taxTreatment} 
                onChange={e => setFormData({...formData, taxTreatment: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                <option value="with_tax">Con IVA</option>
                <option value="without_tax">Sin IVA</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Total Factura (€) *</label>
              <input 
                type="number" 
                step="0.01"
                required 
                value={formData.totalAmount} 
                onChange={e => setFormData({...formData, totalAmount: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontWeight: "600" }}
              />
            </div>
          </div>

          {!isNoTaxUI && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div></div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Tipo de IVA *</label>
                <select 
                  required 
                  value={formData.taxRate} 
                  onChange={e => setFormData({...formData, taxRate: e.target.value})} 
                  style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                >
                  <option value="0.21">21%</option>
                  <option value="0.10">10%</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", backgroundColor: "var(--surface-hover)", borderRadius: "var(--radius-sm)" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.25rem" }}>Base Imponible</span>
              <span className="brand-font" style={{ fontSize: "1.25rem", color: "var(--foreground)" }}>{computedBase} €</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.25rem" }}>Total IVA</span>
              <span className="brand-font" style={{ fontSize: "1.25rem", color: "var(--foreground)" }}>{computedTax} €</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Estado de Pago *</label>
              <select 
                required 
                value={formData.paymentStatus} 
                onChange={e => setFormData({...formData, paymentStatus: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                <option value="pending">Pendiente de Pago</option>
                <option value="paid">Pagado (Descontar de cuenta ahora)</option>
              </select>
            </div>

            {formData.paymentStatus === "paid" && (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Cuenta de Origen *</label>
                <select 
                  required 
                  value={formData.treasuryAccountId} 
                  onChange={e => setFormData({...formData, treasuryAccountId: e.target.value})} 
                  style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.paymentStatus === "pending" && (
               <div>
               <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Fecha de Vencimiento *</label>
               <input 
                 type="date" 
                 required 
                 value={formData.dueDate} 
                 onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                 style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
               />
             </div>
            )}
          </div>

          {!isNoTaxUI && (
            <div style={{ padding: "1rem", backgroundColor: "var(--surface-hover)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--foreground)", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={formData.taxDeductible} 
                  onChange={e => setFormData({...formData, taxDeductible: e.target.checked})} 
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-foreground)" }}
                />
                Gasto deducible (Este IVA restará del IVA a pagar en el trimestre)
              </label>
            </div>
          )}

          <DocumentInput documents={formData.documents} onChange={docs => setFormData({...formData, documents: docs})} />

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer", fontFamily: "minimo" }}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}>Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
