"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { BookPlus, Check, X, Tag, List } from "lucide-react";
import { createClassificationRuleAndApply } from "@/actions/mapping";

export default function MappingModal({ 
  movement, 
  onClose,
  onSuccess
}: { 
  movement: any, 
  onClose: () => void,
  onSuccess?: () => void
}) {
  const [keyword, setKeyword] = useState(movement.description || "");
  const [targetType, setTargetType] = useState("service");
  const [fiscalRule, setFiscalRule] = useState("normal_taxable_sale");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!keyword.trim()) {
      setError("La palabra clave no puede estar vacía");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await createClassificationRuleAndApply(
      movement.id,
      keyword.trim(),
      targetType,
      fiscalRule
    );

    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.error || "Ocurrió un error al guardar la regla.");
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
      backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", 
      alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }}>
      <div className="editorial-panel" style={{ width: "90%", maxWidth: "600px", position: "relative", padding: "3rem", maxHeight: "90vh", overflowY: "auto" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
          <X size={24} />
        </button>

        <h2 className="brand-font" style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--primary)" }}>Mapear Nueva Regla</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
          Enséñale al sistema cómo clasificar e interpretar fiscalmente este registro en el futuro.
        </p>

        {/* Context Reference */}
        <div style={{ backgroundColor: "var(--surface-hover)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "2rem", borderLeft: "3px solid var(--accent-foreground)" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.25rem" }}>Descripción Original Koibox</p>
          <p className="brand-font" style={{ fontSize: "1.1rem", color: "var(--primary)" }}>{movement.description}</p>
          
          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Importe Base</p>
              <p style={{ fontSize: "0.9rem", fontWeight: "600" }}>€ {movement.baseAmount?.toFixed(2) || "0.00"}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-soft)" }}>Importe Total</p>
              <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--accent-foreground)" }}>€ {movement.totalAmount?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              <Tag size={16} /> Palabra Clave Identificativa
            </label>
            <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginBottom: "0.5rem" }}>El sistema buscará este texto exacto en futuros Excel para autocalificarlo.</p>
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                <List size={16} /> Tipo Operativo
              </label>
              <select 
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)" }}
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
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                <BookPlus size={16} /> Regla Fiscal (IVA)
              </label>
              <select 
                value={fiscalRule}
                onChange={(e) => setFiscalRule(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)" }}
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
            </div>
          </div>
          
          <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                <span>🎯 Ámbito de Búsqueda de la Regla (Granularidad)</span>
              </label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", marginBottom: "0.5rem" }}>¿Dónde debe el sistema buscar esta palabra clave en futuras importaciones?</p>
              <select 
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", outlineColor: "var(--accent-foreground)", backgroundColor: "var(--surface)" }}
                disabled 
                title="Para la Fase 2 esto buscará en toda la descripción bruta. El soporte por segmentos estará habilitado pronto."
              >
                <option value="full_description">En toda la descripción bruta (Por defecto)</option>
                <option value="client_name">Solo en nombre del cliente</option>
                <option value="service_segment">Solo en segmento de servicios</option>
                <option value="product_segment">Solo en segmentos de productos</option>
              </select>
          </div>

        </div>

        {error && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--danger-bg)", color: "var(--danger)", fontSize: "0.85rem", borderRadius: "var(--radius-sm)" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
           <button 
             onClick={onClose}
             style={{ background: "none", border: "1px solid var(--border)", padding: "0.75rem 1.5rem", cursor: "pointer", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}
           >
             Cancelar
           </button>
           <button 
             onClick={handleSave}
             disabled={isSubmitting}
             style={{ 
               backgroundColor: "var(--primary)", color: "var(--surface)", border: "none", padding: "0.75rem 2rem", cursor: "pointer", 
               fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em",
               display: "flex", alignItems: "center", gap: "0.5rem", opacity: isSubmitting ? 0.7 : 1
             }}
           >
             {isSubmitting ? "Guardando..." : "Guardar y Aplicar Regla"}
           </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
