"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "../../lib/utils";
import { Plus, Link as LinkIcon, Paperclip, Search, Filter } from "lucide-react";
import ExpenseModal from "./ExpenseModal";
import PayrollModal from "./PayrollModal";
import TaxModal from "./TaxModal";
import ViewExpenseModal from "./ViewExpenseModal";

export default function ExpensesClient({ accounts, categories, employees, suppliers, expenses, payrolls, taxes }: any) {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [hasDocuments, setHasDocuments] = useState("all"); // 'all', 'yes', 'no'
  const [paymentStatus, setPaymentStatus] = useState("all"); // 'all', 'paid', 'pending'

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp: any) => {
      // 1. Text Search (description, supplier)
      const matchesSearch = !searchQuery || 
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (exp.supplier?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Date Range
      const expDate = new Date(exp.dueDate).getTime();
      const matchesStartDate = !startDate || expDate >= new Date(startDate).getTime();
      const matchesEndDate = !endDate || expDate <= new Date(endDate).getTime() + 86400000; // Add 1 day to include end date fully

      // 3. Category
      const matchesCategory = !categoryId || exp.categoryId === categoryId;

      // 4. Account
      const matchesAccount = !accountId || exp.treasuryAccountId === accountId;

      // 5. Documents
      const matchesDocs = hasDocuments === "all" || 
        (hasDocuments === "yes" && exp.documents && exp.documents.length > 0) ||
        (hasDocuments === "no" && (!exp.documents || exp.documents.length === 0));

      // 6. Payment Status
      const matchesStatus = paymentStatus === "all" || exp.paymentStatus === paymentStatus;

      return matchesSearch && matchesStartDate && matchesEndDate && matchesCategory && matchesAccount && matchesDocs && matchesStatus;
    });
  }, [expenses, searchQuery, startDate, endDate, categoryId, accountId, hasDocuments, paymentStatus]);

  return (
    <>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Nuevo Gasto / Factura
        </button>
        <button className="btn-secondary" onClick={() => setIsPayrollModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Nueva Nómina
        </button>
        <button className="btn-secondary" onClick={() => setIsTaxModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Pago de Impuesto
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="editorial-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          <Search size={18} color="var(--text-soft)" />
          <input 
            type="text" 
            placeholder="Buscar concepto o proveedor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", color: "var(--foreground)" }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} title="Fecha Desde" style={{ padding: "0.5rem" }} />
          <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} title="Fecha Hasta" style={{ padding: "0.5rem" }} />
        </div>

        <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">Todas las categorías</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>

        <select className="input-field" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">Todas las cuentas</option>
          {accounts.map((acc: any) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>

        <select className="input-field" value={hasDocuments} onChange={(e) => setHasDocuments(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="all">Documentos (Todos)</option>
          <option value="yes">Con adjuntos</option>
          <option value="no">Sin adjuntos</option>
        </select>

        <select className="input-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="all">Estado (Todos)</option>
          <option value="paid">Pagados</option>
          <option value="pending">Pendientes de pago</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "3rem" }}>
        
        {/* Facturas */}
        <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-hover)" }}>
            <h2 className="brand-font" style={{ fontSize: "1.1rem", color: "var(--foreground)" }}>Últimos Gastos / Facturas</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", opacity: 0.7 }}>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Vencimiento</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Descripción</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Estado</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No se encontraron gastos con estos filtros.</td></tr>
              )}
              {filteredExpenses.map((exp: any) => (
                <tr 
                  key={exp.id} 
                  onClick={() => setSelectedExpense(exp)}
                  className="hover-bg-surface-hover"
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background-color 0.2s" }}
                >
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>{new Date(exp.dueDate).toLocaleDateString("es-ES")}</td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>
                    <div style={{ fontWeight: "500", color: "var(--foreground)" }}>{exp.description}</div>
                    {exp.supplier && <div style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginTop: "0.15rem" }}>{exp.supplier.name}</div>}
                    
                    {exp.documents && exp.documents.length > 0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                         <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.15rem 0.5rem", borderRadius: "12px", backgroundColor: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text-soft)" }}>
                           <Paperclip size={12} /> {exp.documents.length} adjunto(s)
                         </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem",
                      backgroundColor: exp.paymentStatus === 'paid' ? 'rgba(84, 162, 102, 0.15)' : exp.paymentStatus === 'partial' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(215, 126, 106, 0.15)', 
                      color: exp.paymentStatus === 'paid' ? 'var(--success)' : exp.paymentStatus === 'partial' ? '#ca8a04' : 'var(--danger)' 
                    }}>
                      {exp.paymentStatus === 'paid' ? 'Pagado' : exp.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.9rem", textAlign: "right", fontWeight: "600" }}>{formatCurrency(exp.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nóminas */}
        <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-hover)" }}>
            <h2 className="brand-font" style={{ fontSize: "1.1rem", color: "var(--foreground)" }}>Últimas Nóminas</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", opacity: 0.7 }}>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Fecha</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Empleado</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Tipo</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase" }}>Estado</th>
                <th style={{ padding: "1rem 2rem", fontSize: "0.65rem", textTransform: "uppercase", textAlign: "right" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin registros</td></tr>
              )}
              {payrolls.map((pay: any) => (
                <tr key={pay.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>{new Date(pay.date).toLocaleDateString("es-ES")}</td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>{pay.employee?.name || "Desconocido"}</td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", textTransform: "capitalize" }}>
                    <div>{pay.type.replace("_", " ")}</div>
                    {pay.documents && pay.documents.length > 0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                         <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.15rem 0.5rem", borderRadius: "12px", backgroundColor: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text-soft)" }}>
                           <Paperclip size={12} /> {pay.documents.length} adjunto(s)
                         </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem",
                      backgroundColor: pay.status === 'paid' ? 'rgba(84, 162, 102, 0.15)' : pay.status === 'partial' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(215, 126, 106, 0.15)', 
                      color: pay.status === 'paid' ? 'var(--success)' : pay.status === 'partial' ? '#ca8a04' : 'var(--danger)' 
                    }}>
                      {pay.status === 'paid' ? 'Pagado' : pay.status === 'partial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 2rem", fontSize: "0.9rem", textAlign: "right", fontWeight: "600" }}>{formatCurrency(pay.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => { setIsExpenseModalOpen(false); setExpenseToEdit(null); }} 
        accounts={accounts} 
        categories={categories} 
        suppliers={suppliers}
        initialData={expenseToEdit}
      />
      <PayrollModal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} accounts={accounts} employees={employees} />
      <TaxModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} accounts={accounts} />
      <ViewExpenseModal 
        isOpen={!!selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
        expense={expenses.find((e: any) => e.id === selectedExpense?.id) || selectedExpense} 
        accounts={accounts}
        onEdit={(exp) => {
          setSelectedExpense(null);
          setExpenseToEdit(exp);
          setIsExpenseModalOpen(true);
        }}
      />

    </>
  );
}
