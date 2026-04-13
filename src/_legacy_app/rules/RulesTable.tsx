"use client";

import { useState } from "react";
import { Edit2, Trash2, Power, Check, X } from "lucide-react";
import { deleteClassificationRule, toggleClassificationRule, updateClassificationRule } from "@/actions/mapping";

export default function RulesTable({ rules }: { rules: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (rule: any) => {
    setEditingId(rule.id);
    setEditForm({
      keyword: rule.keyword,
      targetType: rule.targetType,
      targetFiscalRule: rule.targetFiscalRule,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setIsSaving(true);
    const res = await updateClassificationRule(editingId!, editForm);
    setIsSaving(false);
    if (res.success) {
      setEditingId(null);
    } else {
      alert(res.error || "Error al actualizar la regla");
    }
  };

  const toggleRule = async (id: string, currentActive: boolean) => {
    await toggleClassificationRule(id, !currentActive);
  };

  const deleteRule = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta regla? Los movimientos ya clasificados no cambiarán, pero no se aplicará en el futuro.")) {
      await deleteClassificationRule(id);
    }
  };

  return (
    <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", backgroundColor: "var(--surface-hover)" }}>
            <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Estado</th>
            <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Palabra Clave</th>
            <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Tipo Operativo</th>
            <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em" }}>Tratamiento Fiscal</th>
            <th style={{ padding: "1.25rem 2rem", fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.1em", textAlign: "right" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-soft)" }}>No hay reglas de mapeo configuradas.</td>
            </tr>
          )}
          {rules.map((rule) => {
            const isEditing = editingId === rule.id;

            return (
              <tr key={rule.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: rule.active ? "transparent" : "var(--surface)", opacity: rule.active ? 1 : 0.6 }}>
                <td style={{ padding: "1.25rem 2rem", width: "5%" }}>
                   <button 
                     onClick={() => toggleRule(rule.id, rule.active)}
                     title={rule.active ? "Deshabilitar regla" : "Habilitar regla"}
                     style={{ background: "none", border: "none", cursor: "pointer", color: rule.active ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center" }}
                   >
                     <Power size={18} />
                   </button>
                </td>
                
                <td style={{ padding: "1.25rem 2rem", width: "30%" }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.keyword} 
                      onChange={(e) => setEditForm({...editForm, keyword: e.target.value})}
                      style={{ width: "100%", padding: "0.5rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--accent-foreground)", borderRadius: "var(--radius-sm)", outline: "none", backgroundColor: "var(--surface-hover)", color: "var(--foreground)" }}
                    />
                  ) : (
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--primary)", textDecoration: rule.active ? "none" : "line-through" }}>{rule.keyword}</span>
                  )}
                </td>

                <td style={{ padding: "1.25rem 2rem", width: "25%" }}>
                  {isEditing ? (
                    <select 
                      value={editForm.targetType} 
                      onChange={(e) => setEditForm({...editForm, targetType: e.target.value})}
                      style={{ width: "100%", padding: "0.5rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <option value="service">Venta de servicio</option>
                      <option value="product">Venta de producto físico</option>
                      <option value="voucher">Venta de bono</option>
                      <option value="gift_card">Venta de tarjeta regalo</option>
                      <option value="gift_card_redemption">Canje de tarjeta regalo</option>
                      <option value="consumption_voucher">Consumo de sesión de bono</option>
                      <option value="customer_balance_usage">Uso de saldo de cliente</option>
                      <option value="service_refund">Devolución de servicio</option>
                      <option value="product_refund">Devolución de producto</option>
                      <option value="debt_payment">Cobro de deuda</option>
                      <option value="unknown">Ajuste / otro</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{rule.targetType.replace(/_/g, " ")}</span>
                  )}
                </td>

                <td style={{ padding: "1.25rem 2rem", width: "25%" }}>
                  {isEditing ? (
                    <select 
                      value={editForm.targetFiscalRule} 
                      onChange={(e) => setEditForm({...editForm, targetFiscalRule: e.target.value})}
                      style={{ width: "100%", padding: "0.5rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <option value="normal_taxable_sale">Venta Normal (+IVA)</option>
                      <option value="prepaid_voucher_sale">Venta de Bono (+IVA Anticipado)</option>
                      <option value="voucher_session_consumption">Consumo de Sesión Bono (Sin IVA)</option>
                      <option value="gift_card_sale">Venta de Tarjeta Regalo (+IVA)</option>
                      <option value="gift_card_redemption">Canje de Tarjeta Regalo (Sin IVA)</option>
                      <option value="customer_balance_usage">Uso de Saldo a Favor (Sin IVA)</option>
                      <option value="refund">Devolución / Abono (-IVA)</option>
                      <option value="debt_payment">Cobro de Deuda (Sin IVA)</option>
                      <option value="adjustment">Ajuste Financiero (Sin IVA)</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rule.targetFiscalRule.replace(/_/g, " ")}</span>
                  )}
                </td>

                <td style={{ padding: "1.25rem 2rem", width: "15%", textAlign: "right" }}>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button onClick={saveEdit} disabled={isSaving} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--success)" }} title="Guardar">
                        <Check size={18} />
                      </button>
                      <button onClick={cancelEdit} disabled={isSaving} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} title="Cancelar">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                      <button onClick={() => startEdit(rule)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)" }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }} title="Eliminar permanentemente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
