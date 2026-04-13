import { useState } from "react";
import { format } from "date-fns";
import { createPayrollEntry } from "@/actions/expenses";
import DocumentInput, { DocumentEntry } from "@/components/DocumentInput";

export default function PayrollModal({ isOpen, onClose, accounts, employees }: { isOpen: boolean, onClose: () => void, accounts: any[], employees: any[] }) {
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || "",
    amount: "",
    note: "",
    status: "paid",
    date: format(new Date(), "yyyy-MM-dd"),
    treasuryAccountId: accounts[0]?.id || "",
    documents: [] as DocumentEntry[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Server action
    const res = await createPayrollEntry({
      ...formData,
      amount: parseFloat(formData.amount),
      paidDate: formData.status === "paid" ? formData.date : null
    });
    
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "100%", maxWidth: "500px", margin: "1rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--foreground)" }}>Nueva Nómina</h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Empleado *</label>
              <select 
                required 
                value={formData.employeeId} 
                onChange={e => setFormData({...formData, employeeId: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Anotación Opcional</label>
              <input 
                type="text" 
                placeholder="Ej: Solo medio mes, etc."
                value={formData.note} 
                onChange={e => setFormData({...formData, note: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Importe Neto (€) *</label>
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
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Fecha *</label>
              <input 
                type="date" 
                required 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Estado de Pago *</label>
              <select 
                required 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})} 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                <option value="paid">Pagado (Descontar de cuenta ahora)</option>
                <option value="pending">Pendiente de Pago</option>
              </select>
            </div>

            {formData.status === "paid" && (
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
          </div>

          <DocumentInput documents={formData.documents} onChange={docs => setFormData({...formData, documents: docs})} />

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer", fontFamily: "minimo" }}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}>Guardar Nómina</button>
          </div>
        </form>
      </div>
    </div>
  );
}
