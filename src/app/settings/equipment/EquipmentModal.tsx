"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign } from "lucide-react";
import { createEquipment, updateEquipment } from "@/actions/equipment";

export default function EquipmentModal({ 
  isOpen, 
  onClose, 
  equipment = null 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  equipment?: any;
}) {
  const [formData, setFormData] = useState({
    name: "",
    purchaseDate: "",
    purchasePrice: 0,
    active: true,
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || "",
        purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : "",
        purchasePrice: equipment.purchasePrice || 0,
        active: equipment.active ?? true,
        notes: equipment.notes || ""
      });
    } else {
      setFormData({
        name: "",
        purchaseDate: "",
        purchasePrice: 0,
        active: true,
        notes: ""
      });
    }
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) {
      setError("El nombre es obligatorio.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: formData.name,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : null,
      purchasePrice: formData.purchasePrice > 0 ? Number(formData.purchasePrice) : null,
      active: formData.active,
      notes: formData.notes
    };

    let result;
    if (equipment?.id) {
      result = await updateEquipment(equipment.id, payload);
    } else {
      result = await createEquipment(payload);
    }

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
      <div style={{ backgroundColor: "var(--background)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", width: "100%", maxWidth: "500px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface)" }}>
          <h2 className="brand-font" style={{ margin: 0, fontSize: "1.25rem", color: "var(--foreground)" }}>
            {equipment ? "Editar Aparatología" : "Nueva Aparatología"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderLeft: "3px solid #ef4444", color: "#fca5a5", fontSize: "0.85rem", borderRadius: "0 0.25rem 0.25rem 0" }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Nombre del Aparato <span style={{ color: "#ef4444" }}>*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. HIFU Premium 360"
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", backgroundColor: "#111", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Fecha de Compra</label>
              <div style={{ position: "relative" }}>
                <Calendar size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="date" 
                  value={formData.purchaseDate}
                  onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", backgroundColor: "#111", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Precio de Compra</label>
              <div style={{ position: "relative" }}>
                <DollarSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="number" 
                  min="0" step="0.01"
                  value={formData.purchasePrice || ""}
                  onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", backgroundColor: "#111", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Observaciones</label>
            <textarea 
              value={formData.notes || ""}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas generales o de mantenimiento..."
              rows={3}
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", backgroundColor: "#111", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "inherit", resize: "vertical" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <input 
              type="checkbox" 
              checked={formData.active}
              onChange={e => setFormData({...formData, active: e.target.checked})}
              style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer", accentColor: "var(--primary)" }}
            />
            <span style={{ fontSize: "0.9rem", color: "var(--foreground)", fontWeight: 500 }}>Aparato Activo y Disponible</span>
          </label>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", marginTop: "0.5rem" }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "transparent", color: "var(--text-soft)", border: "1px solid var(--border)", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary)", color: "#000", border: "none", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Guardando..." : "Guardar Aparatología"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
