import { useState } from "react";
import { format } from "date-fns";
import { createExternalInflow } from "@/actions/treasury";
import DocumentInput, { DocumentEntry } from "@/components/DocumentInput";

export default function ExternalInflowModal({ isOpen, onClose, accounts }: { isOpen: boolean, onClose: () => void, accounts: any[] }) {
  const [formData, setFormData] = useState({
    destinationAccountId: accounts[0]?.id || "",
    amount: "",
    description: "",
    externalEntity: "",
    date: format(new Date(), "yyyy-MM-dd"),
    documents: [] as DocumentEntry[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amountNum = parseFloat(formData.amount);
    
    // Server action
    const res = await createExternalInflow(
      formData.destinationAccountId, 
      amountNum, 
      formData.description, 
      formData.externalEntity, 
      new Date(formData.date),
      formData.documents
    );
    
    setIsSubmitting(false);
    if (res.success) {
      onClose();
      // Reset
      setFormData({ ...formData, amount: "", description: "", externalEntity: "", documents: [] });
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "100%", maxWidth: "500px", margin: "1rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--success)" }}>Nuevo Ingreso Externo</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2rem" }}>Registra dinero real entrando al negocio desde fuera (ej: Pago de Volveremos, Subvenciones, Deuda).</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Importe (€) *</label>
            <input 
              type="number" 
              step="0.01"
              required 
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})} 
              style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Entidad de Origen *</label>
            <input 
              type="text" 
              required 
              placeholder="Ej: Ayuntamiento (Volveremos)"
              value={formData.externalEntity} 
              onChange={e => setFormData({...formData, externalEntity: e.target.value})} 
              style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Descripción *</label>
            <input 
              type="text" 
              required 
              placeholder="Motivo del ingreso"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Fecha *</label>
              <input 
                type="date" 
                required 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Cuenta de Destino *</label>
              <select 
                required 
                value={formData.destinationAccountId} 
                onChange={e => setFormData({...formData, destinationAccountId: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <DocumentInput documents={formData.documents} onChange={docs => setFormData({...formData, documents: docs})} />

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer", fontFamily: "minimo" }}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ backgroundColor: "var(--success)", borderColor: "var(--success)" }}>Guardar Ingreso</button>
          </div>
        </form>
      </div>
    </div>
  );
}
