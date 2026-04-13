"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Plus, Link as LinkIcon, Paperclip, Search, Filter } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import InternalTransferModal from "./InternalTransferModal";
import ExternalInflowModal from "./ExternalInflowModal";
import ExternalOutflowModal from "./ExternalOutflowModal";
import AccountManagerModal from "./AccountManagerModal";
import AdjustmentModal from "./AdjustmentModal";
import ViewTreasuryMovementModal from "./ViewTreasuryMovementModal";

export default function TreasuryClient({ accounts, recentMovements, pendingInstallments = [] }: { accounts: any[], recentMovements: any[], pendingInstallments?: any[] }) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [movementType, setMovementType] = useState(""); // inflow, outflow, internal_transfer
  const [accountId, setAccountId] = useState("");
  const [hasDocuments, setHasDocuments] = useState("all");

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return recentMovements.filter((mov: any) => {
      // 1. Text Search (description, externalEntity)
      const matchesSearch = !searchQuery || 
        mov.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (mov.externalEntity || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Date Range
      const movDate = new Date(mov.date).getTime();
      const matchesStartDate = !startDate || movDate >= new Date(startDate).getTime();
      const matchesEndDate = !endDate || movDate <= new Date(endDate).getTime() + 86400000;

      // 3. Movement Type
      const matchesType = !movementType || mov.type === movementType;

      // 4. Account (either source or destination)
      const matchesAccount = !accountId || 
        mov.sourceAccountId === accountId || 
        mov.destinationAccountId === accountId;

      // 5. Documents
      const matchesDocs = hasDocuments === "all" || 
        (hasDocuments === "yes" && mov.documents && mov.documents.length > 0) ||
        (hasDocuments === "no" && (!mov.documents || mov.documents.length === 0));

      return matchesSearch && matchesStartDate && matchesEndDate && matchesType && matchesAccount && matchesDocs;
    });
  }, [recentMovements, searchQuery, startDate, endDate, movementType, accountId, hasDocuments]);

  return (
    <>
      {/* Account Balances Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        {accounts.map(account => (
          <div key={account.id} className="editorial-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "1rem" }}>{account.name}</h3>
            <p className="brand-font" style={{ fontSize: "2.5rem", color: "var(--primary)", lineHeight: "1" }}>
              {formatCurrency(account.balance)}
            </p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>Apertura: {formatCurrency(account.initialBalance)}</span>
              <span style={{ textTransform: "uppercase" }}>{account.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setIsInflowModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowDownToLine size={18} /> Ingreso Externo
          </button>
          <button className="btn-secondary" onClick={() => setIsOutflowModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowUpFromLine size={18} /> Gasto / Salida
          </button>
          <button className="btn-secondary" onClick={() => setIsTransferModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowRightLeft size={18} /> Trasvase Interno
          </button>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => setIsAdjustmentModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px dashed var(--border)" }}>
            <Plus size={18} /> Ajuste Manual
          </button>
          <button className="btn-secondary" onClick={() => setIsAccountManagerOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px dashed var(--border)" }}>
            Gestionar Cuentas
          </button>
        </div>
      </div>

      {/* FILTER BAR for Movements */}
      <div className="editorial-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          <Search size={18} color="var(--text-soft)" />
          <input 
            type="text" 
            placeholder="Buscar concepto o entidad..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", color: "var(--foreground)" }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} title="Fecha Desde" style={{ padding: "0.5rem" }} />
          <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} title="Fecha Hasta" style={{ padding: "0.5rem" }} />
        </div>

        <select className="input-field" value={movementType} onChange={(e) => setMovementType(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">Cualquier tipo</option>
          <option value="inflow">Ingreso Externo</option>
          <option value="outflow">Gasto / Salida</option>
          <option value="internal_transfer">Trasvase Interno</option>
        </select>

        <select className="input-field" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">Cualquier cuenta</option>
          {accounts.map((acc: any) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>

        <select className="input-field" value={hasDocuments} onChange={(e) => setHasDocuments(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="all">Documentos (Todos)</option>
          <option value="yes">Con adjuntos</option>
          <option value="no">Sin adjuntos</option>
        </select>
      </div>

      {/* Pending Installments (Forecast) */}
      <div className="editorial-panel" style={{ padding: "0", overflow: "hidden", marginBottom: "3rem", borderLeft: "4px solid var(--warning)" }}>
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-hover)" }}>
          <h2 className="brand-font" style={{ fontSize: "1.25rem", color: "var(--foreground)" }}>Previsión de Pagos Pendientes</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>
            Total Pendiente: <strong style={{ color: "var(--foreground)" }}>{formatCurrency(pendingInstallments.reduce((sum: number, i: any) => sum + i.amount, 0))}</strong>
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Vencimiento</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Concepto / Origen</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Beneficiario</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em", textAlign: "right" }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {pendingInstallments.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-soft)" }}>No hay pagos pendientes previstos. Todo al día.</td>
              </tr>
            )}
            {pendingInstallments.map((inst: any) => {
              const date = new Date(inst.expectedDate).toLocaleDateString("es-ES");
              const isOverdue = new Date(inst.expectedDate) < new Date();
              
              let typeLabel = "Obligación";
              let desc = "Sin descripción";
              let entity = "-";
              
              if (inst.expense) {
                typeLabel = "Gasto / Factura";
                desc = inst.expense.description;
                if (inst.expense.supplier) entity = inst.expense.supplier.name;
              } else if (inst.taxEntry) {
                typeLabel = "Impuesto";
                desc = `${inst.taxEntry.taxType.replace("_", " ")} - ${inst.taxEntry.period}`;
                entity = "Agencia Tributaria";
              } else if (inst.payrollEntry) {
                typeLabel = "Nómina";
                desc = `Nómina ${new Date(inst.payrollEntry.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
                if (inst.payrollEntry.employee) entity = inst.payrollEntry.employee.name;
              }

              return (
                <tr key={inst.id} style={{ borderBottom: "1px solid var(--border)" }}>
                   <td style={{ padding: "1.25rem 2rem", fontSize: "0.85rem", color: isOverdue ? "var(--warning)" : "var(--foreground)", fontWeight: isOverdue ? "600" : "normal" }}>
                     {date} {isOverdue && <span style={{ fontSize: "0.7rem", marginLeft: "4px" }}>(Vencido)</span>}
                   </td>
                   <td style={{ padding: "1.25rem 2rem" }}>
                     <div style={{ fontSize: "0.85rem", color: "var(--foreground)", fontWeight: "500" }}>{desc}</div>
                     <div style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginTop: "2px" }}>{typeLabel}</div>
                   </td>
                   <td style={{ padding: "1.25rem 2rem", fontSize: "0.85rem", color: "var(--text-soft)" }}>
                     {entity}
                   </td>
                   <td style={{ padding: "1.25rem 2rem", fontSize: "0.95rem", fontWeight: "600", textAlign: "right", color: "var(--foreground)" }}>
                     {formatCurrency(inst.amount)}
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Movements History */}
      <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="brand-font" style={{ fontSize: "1.25rem", color: "var(--foreground)" }}>Historial de Movimientos</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", backgroundColor: "var(--surface-hover)" }}>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Fecha</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Tipo</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Descripción / Entidad</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Cuentas Implicadas</th>
              <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em", textAlign: "right" }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-soft)" }}>No se encontraron movimientos con estos filtros.</td>
              </tr>
            )}
            {filteredMovements.map((mov: any) => (
              <tr 
                key={mov.id} 
                onClick={() => setSelectedMovement(mov)}
                className="hover-bg-surface-hover"
                style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background-color 0.2s" }}
              >
                <td style={{ padding: "1.25rem 2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {new Date(mov.date).toLocaleDateString("es-ES")}
                </td>
                <td style={{ padding: "1.25rem 2rem", fontSize: "0.85rem" }}>
                  {mov.type === "inflow" && <span style={{ color: "var(--success)" }}>Ingreso Externo</span>}
                  {mov.type === "outflow" && <span style={{ color: "var(--danger)" }}>Gasto / Salida</span>}
                  {mov.type === "internal_transfer" && <span style={{ color: "var(--accent-foreground)" }}>Trasvase Interno</span>}
                  {mov.isAdjustment && <div style={{ fontSize: "0.7rem", color: "var(--text-soft)", marginTop: "2px" }}>Ajuste Manual</div>}
                </td>
                <td style={{ padding: "1.25rem 2rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--foreground)", fontWeight: "500" }}>{mov.description}</div>
                  {mov.externalEntity && <div style={{ fontSize: "0.75rem", color: "var(--text-soft)" }}>Entidad: {mov.externalEntity}</div>}
                  {mov.documents && mov.documents.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                       <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.15rem 0.5rem", borderRadius: "12px", backgroundColor: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text-soft)" }}>
                         <Paperclip size={12} /> {mov.documents.length} adjunto(s)
                       </span>
                    </div>
                  )}
                </td>
                <td style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {mov.type === "inflow" && <span>Hacia: {mov.destinationAccount?.name}</span>}
                  {mov.type === "outflow" && <span>Desde: {mov.sourceAccount?.name}</span>}
                  {mov.type === "internal_transfer" && <span>De {mov.sourceAccount?.name} a {mov.destinationAccount?.name}</span>}
                </td>
                <td style={{ padding: "1.25rem 2rem", fontSize: "0.95rem", fontWeight: "600", textAlign: "right", color: mov.type === "outflow" ? "var(--danger)" : "var(--foreground)" }}>
                  {mov.type === "outflow" ? "-" : ""}{formatCurrency(mov.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InternalTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} accounts={accounts} />
      <ExternalInflowModal isOpen={isInflowModalOpen} onClose={() => setIsInflowModalOpen(false)} accounts={accounts} />
      <ExternalOutflowModal isOpen={isOutflowModalOpen} onClose={() => setIsOutflowModalOpen(false)} accounts={accounts} />
      <AccountManagerModal isOpen={isAccountManagerOpen} onClose={() => setIsAccountManagerOpen(false)} accounts={accounts} />
      <AdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} accounts={accounts} />
      <ViewTreasuryMovementModal isOpen={!!selectedMovement} onClose={() => setSelectedMovement(null)} movement={selectedMovement} />
    </>
  );
}
