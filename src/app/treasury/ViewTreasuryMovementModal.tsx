import { formatCurrency } from "@/lib/utils";
import { Link as LinkIcon, Paperclip, Calendar, Building2, CreditCard, Tag, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function ViewTreasuryMovementModal({ isOpen, onClose, movement }: { isOpen: boolean, onClose: () => void, movement: any }) {
  if (!isOpen || !movement) return null;

  const isOutflow = movement.type === "outflow";
  const isInflow = movement.type === "inflow";
  const isTransfer = movement.type === "internal_transfer";

  let typeIcon = <ArrowRightLeft size={16} />;
  let typeLabel = "Trasvase Interno";
  let typeColor = "var(--accent-foreground)";
  
  if (isOutflow) {
    typeIcon = <ArrowUpFromLine size={16} />;
    typeLabel = "Salida / Gasto";
    typeColor = "var(--danger)";
  } else if (isInflow) {
    typeIcon = <ArrowDownToLine size={16} />;
    typeLabel = "Ingreso Externo";
    typeColor = "var(--success)";
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "100%", maxWidth: "600px", margin: "1rem", position: "relative" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 className="brand-font" style={{ fontSize: "1.5rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
              Detalle de Movimiento
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
               <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0.2rem 0.6rem", borderRadius: "12px", backgroundColor: "rgba(0,0,0,0.05)", color: typeColor, fontWeight: "600" }}>
                  {typeIcon} {typeLabel}
               </span>
               {movement.isAdjustment && <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", border: "1px dashed var(--text-soft)", color: "var(--text-soft)", fontSize: "0.75rem" }}>Ajuste Manual</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-soft)" }}>&times;</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem", backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
           <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.25rem" }}>Importe</div>
              <div className="brand-font" style={{ fontSize: "2rem", color: typeColor, lineHeight: 1 }}>
                {isOutflow ? "-" : ""}{formatCurrency(movement.amount)}
              </div>
           </div>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                 <Calendar size={16} color="var(--primary)"/>
                 <span><strong>Fecha Operación:</strong> {new Date(movement.date).toLocaleDateString("es-ES")}</span>
              </div>
           </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}><Tag size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Concepto / Descripción</strong>
            <div style={{ fontSize: "1rem" }}>{movement.description}</div>
          </div>
          
          {movement.externalEntity && (
             <div>
               <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.2rem" }}><Building2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Entidad Externa</strong>
               <div style={{ fontSize: "0.95rem" }}>{movement.externalEntity}</div>
             </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
             <strong style={{ fontSize: "0.85rem", color: "var(--text-soft)", display: "block", marginBottom: "0.5rem" }}><CreditCard size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/> Cuentas Implicadas</strong>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 {isTransfer ? (
                   <>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Origen</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>{movement.sourceAccount?.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Destino</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>{movement.destinationAccount?.name}</div>
                      </div>
                   </>
                 ) : isOutflow ? (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Se extrajo de</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>{movement.sourceAccount?.name}</div>
                    </div>
                 ) : (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Se ingresó en</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>{movement.destinationAccount?.name}</div>
                    </div>
                 )}
             </div>
          </div>

        </div>

        <div>
          <h3 style={{ fontSize: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
             <Paperclip size={18} /> Documentos Adjuntos
          </h3>
          
          {(!movement.documents || movement.documents.length === 0) ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No hay documentos adjuntos a este registro.</p>
          ) : (
             <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {movement.documents.map((doc: any) => (
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

      </div>
    </div>
  );
}
