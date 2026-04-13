"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertCircle } from "lucide-react";
import { createService, updateService } from "@/actions/services";

interface ServiceModalProps {
  onClose: () => void;
  initialData?: any;
  categories: string[];
}

export default function ServiceModal({ onClose, initialData, categories }: ServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [formData, setFormData] = useState({
    reference: "",
    name: "",
    category: "",
    employees: "",
    duration: "",
    price: "",
    taxRate: "21",
    active: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        reference: initialData.reference || "",
        name: initialData.name || "",
        category: initialData.category || "",
        employees: initialData.employees || "",
        duration: initialData.duration ? String(initialData.duration) : "",
        price: initialData.price !== undefined ? String(initialData.price) : "",
        taxRate: initialData.taxRate !== null && initialData.taxRate !== undefined ? String(initialData.taxRate) : "21",
        active: initialData.active !== undefined ? initialData.active : true
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      reference: formData.reference || undefined,
      name: formData.name,
      category: formData.category || undefined,
      employees: formData.employees || undefined,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      price: parseFloat(formData.price) || 0,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      active: formData.active
    };

    let res;
    if (initialData?.id) {
      res = await updateService(initialData.id, payload);
    } else {
      res = await createService(payload);
    }

    if (res.success) {
      onClose();
    } else {
      setError(res.error);
      setIsSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "95%", maxWidth: "800px", padding: "0", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--background)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
          <h2 className="brand-font" style={{ fontSize: "1.25rem" }}>
            {initialData ? "Editar Servicio" : "Nuevo Servicio"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--error)", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <AlertCircle size={18} style={{ marginTop: "2px" }}/>
              <span style={{ fontSize: "0.85rem" }}>{error}</span>
            </div>
          )}

          <form id="serviceForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Bloque 1: Datos Generales */}
            <div>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                1. Datos Generales
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Nombre del Servicio *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Referencia</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Categoría</label>
                  {!isCustomCategory ? (
                    <select 
                      value={formData.category} 
                      onChange={e => {
                        if (e.target.value === "___NEW___") {
                           setIsCustomCategory(true);
                           setFormData({...formData, category: ""});
                        } else {
                           setFormData({...formData, category: e.target.value});
                        }
                      }} 
                      style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <option value="">-- Sin categoría --</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="___NEW___">+ Añadir nueva categoría</option>
                    </select>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Nueva categoría..."
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} 
                      />
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="secondary-button" style={{ padding: "0.75rem" }} title="Volver a lista">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloque 2: Condiciones Comerciales y Operativa */}
            <div style={{ paddingTop: "1.5rem", borderTop: "1px dashed var(--border)" }}>
               <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                2. Condiciones Comerciales y Operativa
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Precio Básico (€) *</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontWeight: "600" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Duración (minutos)</label>
                  <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>IVA Aplicado (%)</label>
                  <input type="number" step="1" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
                </div>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Empleados Autorizados (Emails)</label>
                <input type="text" value={formData.employees} onChange={e => setFormData({...formData, employees: e.target.value})} placeholder="email1@ejemplo.com, email2@ejemplo.com..." style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", margin: 0 }}>Introduce los emails separados por coma o espacios. Deben coincidir con los de las fichas de las trabajadoras.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                 <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--foreground)", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} style={{ width: "18px", height: "18px", accentColor: "var(--accent-foreground)" }} />
                  Servicio Activo en el catálogo
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "1rem", backgroundColor: "var(--background)", borderBottomLeftRadius: "var(--radius-lg)", borderBottomRightRadius: "var(--radius-lg)" }}>
          <button type="button" onClick={onClose} className="secondary-button" disabled={isSubmitting}>Cancelar</button>
          <button type="submit" form="serviceForm" className="primary-button" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Save size={16} /> {isSubmitting ? "Guardando..." : "Guardar Servicio"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
