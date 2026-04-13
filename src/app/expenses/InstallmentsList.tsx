"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { createInstallment, updateInstallment, deleteInstallment } from "@/actions/installments";
import { useRouter } from "next/navigation";

export default function InstallmentsList({ expense, accounts }: { expense: any, accounts: any[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isPayingId, setIsPayingId] = useState<string | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  
  // Create / Edit Form state
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  
  // Pay form state
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || "");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const [localInstallments, setLocalInstallments] = useState<any[]>(expense.installments || []);
  
  // Sync when prop updates
  useEffect(() => {
    setLocalInstallments(expense.installments || []);
  }, [expense]);

  const totalInstallmentsAmt = localInstallments.reduce((sum: number, i: any) => sum + i.amount, 0);
  const pendingAmount = expense.totalAmount - totalInstallmentsAmt;

  const handleCreate = async () => {
    if (!newAmount || !newDate) return alert("Rellena todos los campos");
    
    const { installment } = await createInstallment({
      expenseId: expense.id,
      amount: parseFloat(newAmount),
      expectedDate: newDate
    });
    
    if (installment) {
       setLocalInstallments([...localInstallments, installment]);
    }

    setIsAdding(false);
    setNewAmount("");
    setNewDate("");
    router.refresh();
  };

  const handleUpdate = async (id: string) => {
    if (!newAmount || !newDate) return alert("Rellena todos los campos");
    
    await updateInstallment(id, {
      amount: parseFloat(newAmount),
      expectedDate: newDate
    });
    
    setLocalInstallments(prev => prev.map(inst => inst.id === id ? { ...inst, amount: parseFloat(newAmount), expectedDate: newDate } : inst));

    setIsEditingId(null);
    router.refresh();
  };

  const handlePay = async (id: string, amount: number) => {
    if (!payAccountId || !payDate) return alert("Selecciona cuenta y fecha");
    
    await updateInstallment(id, {
      status: "paid",
      treasuryAccountId: payAccountId,
      paidDate: payDate,
      amount: amount, 
      description: `Pago fracción de ${expense.description}`
    });
    
    setLocalInstallments(prev => prev.map(inst => inst.id === id ? { ...inst, status: "paid", paidDate: payDate, treasuryAccountId: payAccountId } : inst));

    setIsPayingId(null);
    router.refresh();
  };

  const handleRevert = async (id: string) => {
    if (confirm("¿Seguro que quieres revertir este pago y borrar el movimiento de tesorería vinculado?")) {
      await updateInstallment(id, { status: "pending" });
      setLocalInstallments(prev => prev.map(inst => inst.id === id ? { ...inst, status: "pending", paidDate: null, treasuryAccountId: null } : inst));
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Borrar este plazo?")) {
      await deleteInstallment(id);
      setLocalInstallments(prev => prev.filter(inst => inst.id !== id));
      router.refresh();
    }
  };

  return (
    <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 className="brand-font" style={{ fontSize: "1.1rem", color: "var(--foreground)", margin: 0 }}>Desglose de Pagos (Plazos)</h3>
        {pendingAmount > 0.01 && !isAdding && (
          <button 
            onClick={() => {
              setNewAmount(pendingAmount.toFixed(2));
              setNewDate(new Date(expense.dueDate).toISOString().split('T')[0]);
              setIsAdding(true);
            }} 
            className="btn-secondary" 
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
          >
            <Plus size={14} style={{ marginRight: "4px" }} /> Añadir Plazo
          </button>
        )}
      </div>

      {totalInstallmentsAmt !== expense.totalAmount && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "var(--surface-hover)", borderLeft: "3px solid var(--warning)", fontSize: "0.85rem", color: "var(--text-soft)" }}>
          <strong>Aviso:</strong> La suma de los plazos ({formatCurrency(totalInstallmentsAmt)}) no coincide con el total de la factura ({formatCurrency(expense.totalAmount)}). Faltan {formatCurrency(expense.totalAmount - totalInstallmentsAmt)} por asignar.
        </div>
      )}

      {/* Adding Form */}
      {isAdding && (
        <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Importe *</label>
            <input type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Fecha Prevista *</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input-field" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleCreate} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>Guardar</button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary" style={{ padding: "0.5rem" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {localInstallments.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>No hay plazos generados. Añade uno o actualiza el gasto.</p>
        ) : (
          localInstallments.map((inst: any, idx: number) => (
            <div key={inst.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontWeight: "600", color: "var(--foreground)" }}>Plazo {idx + 1}</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "700" }}>{formatCurrency(inst.amount)}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {inst.status === 'paid' ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--success)", fontWeight: "500", padding: "0.2rem 0.6rem", backgroundColor: "rgba(84,162,102,0.1)", borderRadius: "12px" }}>
                      <CheckCircle2 size={14} /> Pagado el {new Date(inst.paidDate).toLocaleDateString("es-ES")}
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
                      Previsto para: {new Date(inst.expectedDate).toLocaleDateString("es-ES")}
                    </span>
                  )}

                  {inst.status === 'pending' && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {isPayingId !== inst.id && isEditingId !== inst.id && (
                        <button onClick={() => { setIsPayingId(null); setIsEditingId(null); setIsPayingId(inst.id); }} className="btn-primary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", height: "auto" }}>Pagar</button>
                      )}
                      {isEditingId !== inst.id && isPayingId !== inst.id && (
                        <button onClick={() => { 
                          setIsPayingId(null); 
                          setNewAmount(inst.amount.toString()); 
                          
                          // Convert DB date safely to YYYY-MM-DD for the input
                          const d = new Date(inst.expectedDate);
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          setNewDate(`${yyyy}-${mm}-${dd}`); 
                          
                          setIsEditingId(inst.id); 
                        }} className="btn-secondary" style={{ padding: "0.3rem", border: "none" }}><Edit2 size={16} /></button>
                      )}
                      <button onClick={() => handleDelete(inst.id)} className="btn-secondary" style={{ padding: "0.3rem", color: "var(--danger)", border: "none" }}><Trash2 size={16} /></button>
                    </div>
                  )}

                  {inst.status === 'paid' && (
                    <button onClick={() => handleRevert(inst.id)} className="btn-secondary" title="Revertir Pago" style={{ padding: "0.3rem", fontSize: "0.8rem", height: "auto" }}>
                      Deshacer Pago
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Form Inside the Item */}
              {isEditingId === inst.id && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)", display: "flex", gap: "1rem", alignItems: "end", backgroundColor: "var(--surface)" }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Importe *</label>
                     <input type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="input-field" />
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Fecha Prevista *</label>
                     <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input-field" />
                   </div>
                   <div style={{ display: "flex", gap: "0.5rem" }}>
                     <button onClick={() => handleUpdate(inst.id)} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>Actualizar</button>
                     <button onClick={() => setIsEditingId(null)} className="btn-secondary" style={{ padding: "0.5rem" }}>Cancelar</button>
                   </div>
                </div>
              )}

              {/* Pay Form Inside the Item */}
              {isPayingId === inst.id && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)", display: "flex", gap: "1rem", alignItems: "end" }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Cuenta de Pago *</label>
                     <select value={payAccountId} onChange={e => setPayAccountId(e.target.value)} className="input-field">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                     </select>
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Fecha de Pago Real *</label>
                     <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="input-field" />
                   </div>
                   <div style={{ display: "flex", gap: "0.5rem" }}>
                     <button onClick={() => handlePay(inst.id, inst.amount)} className="btn-primary" style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)", borderColor: "var(--success)" }}>Confirmar Pago</button>
                     <button onClick={() => setIsPayingId(null)} className="btn-secondary" style={{ padding: "0.5rem" }}>Cancelar</button>
                   </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
