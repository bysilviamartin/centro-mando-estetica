import { formatCurrency } from "@/lib/utils";
import { Link as LinkIcon, Paperclip, Calendar, User, CreditCard, Tag, Edit2 } from "lucide-react";
import InstallmentsList from "./InstallmentsList";

export default function ViewExpenseModal({ isOpen, onClose, onEdit, expense, accounts = [] }: { isOpen: boolean, onClose: () => void, onEdit: (expense: any) => void, expense: any, accounts?: any[] }) {
  if (!isOpen || !expense) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "100%", maxWidth: "600px", margin: "1rem", position: "relative" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 className="brand-font" style={{ fontSize: "1.5rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
              Detalle del Gasto / Factura
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
               <span style={{ 
                 padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "600",
                 backgroundColor: expense.paymentStatus === 'paid' ? 'rgba(84, 162, 102, 0.15)' : expense.paymentStatus === 'partial' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(215, 126, 106, 0.15)', 
                 color: expense.paymentStatus === 'paid' ? 'var(--success)' : expense.paymentStatus === 'partial' ? '#ca8a04' : 'var(--danger)' 
               }}>
                  {expense.paymentStatus === 'paid' ? 'Pagado' : expense.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
               </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {expense.paymentStatus === 'pending' && (
              <button onClick={() => onEdit(expense)} title="Editar gasto pendiente" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--foreground)", cursor: "pointer", fontSize: "0.85rem" }}>
                <Edit2 size={14} /> Editar
              </button>
            )}
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-soft)", marginLeft: "0.5rem" }}>&times;</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem", backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
           <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.25rem" }}>Monto Total</div>
              <div className="brand-font" style={{ fontSize: "2rem", color: "var(--foreground)", lineHeight: 1 }}>{formatCurrency(expense.totalAmount)}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-soft)", marginTop: "0.25rem" }}>Base: {formatCurrency(expense.baseAmount)} | IVA: {formatCurrency(expense.taxAmount)}</div>
           </div>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                 <Calendar size={16} color="var(--primary)"/>
                 <span><strong>Vencimiento:</strong> {new Date(expense.dueDate).toLocaleDateString("es-ES")}</span>
              </div>
              {expense.paymentStatus === 'paid' && expense.paidDate && (
                 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <Calendar size={16} color="var(--success)"/>
                    <span><strong>Pagado el:</strong> {new Date(expense.paidDate).toLocaleDateString("es-ES")}</span>
                 </div>
              )}
           </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}><Tag size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Descripción</strong>
            <div style={{ fontSize: "1rem" }}>{expense.description}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
             <div>
               <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}><User size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Proveedor</strong>
               <div style={{ fontSize: "0.95rem" }}>{expense.supplier?.name || "No especificado"}</div>
             </div>
             <div>
               <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}><CreditCard size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Cuenta de Pago</strong>
               <div style={{ fontSize: "0.95rem" }}>{expense.treasuryAccount?.name || "Pendiente de pago / No asignada"}</div>
             </div>
          </div>
          
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}>Categoría</strong>
            <div style={{ fontSize: "0.95rem" }}>{expense.category?.label || "Sin categoría"}</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
             <Paperclip size={18} /> Documentos Adjuntos
          </h3>
          
          {(!expense.documents || expense.documents.length === 0) ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No hay documentos adjuntos a este registro.</p>
          ) : (
             <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {expense.documents.map((doc: any) => (
                   <a 
                     key={doc.id} 
                     href={doc.url} 
                     target="_blank" 
                     rel="noreferrer" 
                     style={{ 
                        display: "flex", alignItems: "center", gap: "0.5rem", 
                        padding: "0.75rem", backgroundColor: "var(--surface)", 
                        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", 
                        color: "var(--accent-foreground)", textDecoration: "none",
                        transition: "background-color 0.2s"
                     }}
                     className="hover-bg-surface-hover"
                   >
                     <LinkIcon size={16} /> 
                     <span style={{ fontWeight: "500", fontSize: "0.95rem" }}>{doc.name}</span>
                   </a>
                ))}
             </div>
          )}
        </div>

        {/* --- INSTALLMENTS LIST INJECTED HERE --- */}
        <InstallmentsList expense={expense} accounts={accounts} />

      </div>
    </div>
  );
}
