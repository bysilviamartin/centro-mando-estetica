"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Calendar, DollarSign, Activity, Layers, TrendingUp, Clock, Percent } from "lucide-react";
import { updateEquipment, linkServiceToEquipment, unlinkServiceFromEquipment, linkServicesByCategoryToEquipment } from "@/actions/equipment";

export default function EquipmentDetailsClient({ initialEquipment, allServices, equipmentSales = [] }: { initialEquipment: any, allServices: any[], equipmentSales?: any[] }) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  async function handleToggleStatus() {
    const res = await updateEquipment(equipment.id, { active: !equipment.active });
    if (res.success) setEquipment({ ...equipment, active: !equipment.active });
  }

  async function handleLink(serviceId: string) {
    setIsLinking(true);
    const res = await linkServiceToEquipment(equipment.id, serviceId);
    if (res.success) setEquipment(res.data);
    setIsLinking(false);
  }

  async function handleUnlink(serviceId: string) {
    if(!confirm("¿Seguro que quieres desvincular este servicio del aparato?")) return;
    setIsLinking(true);
    const res = await unlinkServiceFromEquipment(equipment.id, serviceId);
    if (res.success) setEquipment(res.data);
    setIsLinking(false);
  }

  async function handleLinkFamily() {
    if (!selectedCategory) return;
    setIsLinking(true);
    const res = await linkServicesByCategoryToEquipment(equipment.id, selectedCategory);
    if (res.success) {
      if (res.data) setEquipment(res.data);
      if (res.count === 0) {
        alert("Todos los servicios de esta familia ya estaban vinculados.");
      } else {
        alert(`Se han vinculado ${res.count} servicios de la familia ${selectedCategory}`);
      }
    } else {
      alert("Hubo un error al vincular la familia.");
    }
    setSelectedCategory("");
    setIsLinking(false);
  }

  const linkedServicesIds = equipment.services?.map((s: any) => s.id) || [];
  
  const allCategories = Array.from(new Set(allServices.map(s => s.category).filter(Boolean))).sort();

  const availableServices = allServices.filter(s => 
    !linkedServicesIds.includes(s.id) && 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.reference && s.reference.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalUses = 0;
    let totalMinutes = 0;
    
    const servicesByRef = new Map();
    (equipment.services || []).forEach((s: any) => {
      if (s.reference) servicesByRef.set(s.reference, s);
    });

    const serviceBreakdown = new Map();
    
    equipmentSales.forEach((sale: any) => {
      if (sale.reference && servicesByRef.has(sale.reference)) {
        const relatedService = servicesByRef.get(sale.reference);
        const saleIncome = sale.totalAmount || 0;
        const qty = sale.quantity || 1;
        const mins = (relatedService.duration || 0) * qty;

        totalIncome += saleIncome;
        totalUses += 1;
        totalMinutes += mins;
        
        const existing = serviceBreakdown.get(relatedService.id) || {
          name: relatedService.name,
          reference: relatedService.reference,
          income: 0,
          uses: 0,
          minutes: 0,
        };
        
        existing.income += saleIncome;
        existing.uses += 1;
        existing.minutes += mins;
        
        serviceBreakdown.set(relatedService.id, existing);
      }
    });

    const breakdownArray = Array.from(serviceBreakdown.values()).sort((a, b) => b.income - a.income);
    const purchasePrice = equipment.purchasePrice || 0;
    const paybackDiff = totalIncome - purchasePrice;
    const paybackPct = purchasePrice > 0 ? (totalIncome / purchasePrice) * 100 : 0;

    return {
      totalIncome,
      totalUses,
      totalHours: totalMinutes / 60,
      purchasePrice,
      paybackDiff,
      paybackPct,
      breakdown: breakdownArray
    };
  }, [equipment.services, equipment.purchasePrice, equipmentSales]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* SECCIÓN A: DATOS GENERALES */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Datos Generales
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <span style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha Compra</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", color: "var(--foreground)" }}>
              <Calendar size={16} color="var(--text-soft)" />
              {equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString("es-ES") : "No registrada"}
            </div>
          </div>
          
          <div>
            <span style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio Compra</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", color: "var(--foreground)", fontFamily: "monospace" }}>
              <DollarSign size={16} color="var(--text-soft)" />
              {equipment.purchasePrice ? `${equipment.purchasePrice.toFixed(2)} €` : "No registrado"}
            </div>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</span>
            <button 
              onClick={handleToggleStatus}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: equipment.active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: equipment.active ? "#4ade80" : "#f87171" }}
            >
              <Activity size={14} />
              {equipment.active ? "Activo" : "Inactivo"}
            </button>
          </div>
        </div>

        {equipment.notes && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <span style={{ display: "block", fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Observaciones</span>
            <p style={{ fontSize: "0.9rem", color: "var(--text-soft)", lineHeight: 1.5 }}>{equipment.notes}</p>
          </div>
        )}
      </div>

      {/* SECCIÓN B: RENTABILIDAD (Reordenado) */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Rentabilidad (Histórico Acumulado)</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {/* Ingresos Totales */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingresos Totales</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", color: "var(--foreground)", fontFamily: "monospace", fontWeight: 600 }}>
              <TrendingUp size={18} color="#10b981" />
              {stats.totalIncome.toFixed(2)} €
            </div>
          </div>

          {/* Nº de Servicios */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nº Servicios Válidos</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", color: "var(--foreground)", fontFamily: "monospace", fontWeight: 600 }}>
              <Activity size={18} color="var(--primary)" />
              {stats.totalUses}
            </div>
          </div>

          {/* Horas de Uso */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tiempo de Uso Estimado</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", color: "var(--foreground)", fontFamily: "monospace", fontWeight: 600 }}>
              <Clock size={18} color="#f59e0b" />
              {stats.totalHours.toFixed(1)} h
            </div>
          </div>

          {/* Precio de Compra */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Inversión Original</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", color: "var(--foreground)", fontFamily: "monospace", fontWeight: 600 }}>
              <DollarSign size={18} color="var(--text-soft)" />
              {stats.purchasePrice.toFixed(2)} €
            </div>
          </div>

          {/* Recuperación de Inversión */}
          <div style={{ padding: "1rem", backgroundColor: stats.paybackDiff >= 0 ? "rgba(16, 185, 129, 0.05)" : "var(--surface)", border: `1px solid ${stats.paybackDiff >= 0 ? "rgba(16, 185, 129, 0.2)" : "var(--border)"}`, borderRadius: "var(--radius-md)" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recuperación Inversión</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem", color: stats.paybackDiff >= 0 ? "#10b981" : "var(--foreground)", fontFamily: "monospace", fontWeight: 600 }}>
                {stats.paybackDiff > 0 ? "+" : ""}{stats.paybackDiff.toFixed(2)} €
              </span>
              {stats.purchasePrice > 0 && (
                <span style={{ fontSize: "0.85rem", color: stats.paybackPct >= 100 ? "#10b981" : "var(--text-soft)", display: "flex", alignItems: "center" }}>
                  <Percent size={12} style={{ marginRight: "2px" }} />
                  {stats.paybackPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desglose de Servicios */}
        <h3 style={{ fontSize: "0.95rem", color: "var(--foreground)", marginBottom: "1rem", fontWeight: 600 }}>Desglose por Tratamiento</h3>
        
        {stats.breakdown.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-soft)", fontSize: "0.85rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius-md)" }}>
            Aún no hay ingresos registrados asociados a los tratamientos de esta aparatología.
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-hover)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Servicio</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "right" }}>Ejecuciones</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "right" }}>Horas</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "right" }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {stats.breakdown.map((item, idx) => (
                  <tr key={item.reference || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.15rem" }}>{item.reference}</div>
                      <div style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "0.85rem" }}>{item.name}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--foreground)" }}>
                      {item.uses}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--foreground)" }}>
                      {(item.minutes / 60).toFixed(1)} h
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--foreground)", fontWeight: 600 }}>
                      {item.income.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN C: TRATAMIENTOS ASOCIADOS (Reordenado) */}
      <div className="editorial-panel" style={{ padding: "1.5rem" }}>
        <h2 className="brand-font" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Tratamientos Asociados ({equipment.services?.length || 0})</span>
        </h2>

        {/* Lista de asociados actuales */}
        {(!equipment.services || equipment.services.length === 0) ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)", marginBottom: "2rem" }}>
            No hay ningún servicio asociado a este equipo de forma estructural.
          </div>
        ) : (
          <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {equipment.services.map((svc: any) => (
              <div key={svc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.25rem" }}>{svc.reference || "SIN REF"}</div>
                  <div style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "0.95rem" }}>{svc.name}</div>
                </div>
                <button 
                  onClick={() => handleUnlink(svc.id)}
                  disabled={isLinking}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", borderRadius: "0.35rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", cursor: isLinking ? "not-allowed" : "pointer", opacity: isLinking ? 0.5 : 1 }}
                  title="Desvincular"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Novedad: Buscador por Familia */}
        <div style={{ backgroundColor: "var(--surface)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "0.95rem", color: "var(--foreground)", marginBottom: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={16} color="var(--primary)" /> 
            Asociar por Familia
          </h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem" }}
              >
                <option value="">Seleccionar familia...</option>
                {allCategories.map(cat => (
                  <option key={cat as string} value={cat as string}>{cat as string}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleLinkFamily}
              disabled={isLinking || !selectedCategory}
              className="primary-button"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", opacity: isLinking || !selectedCategory ? 0.5 : 1, cursor: isLinking || !selectedCategory ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              <Plus size={16} /> Añadir todos
            </button>
          </div>
        </div>

        {/* Buscador Unitario */}
        <h3 style={{ fontSize: "0.95rem", color: "var(--foreground)", marginBottom: "1rem", fontWeight: 600 }}>Vincular Tratamiento Individual</h3>
        
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o referencia..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem" }}
          />
        </div>

        {searchTerm.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
            {availableServices.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-soft)", fontSize: "0.85rem" }}>No se encontraron servicios disponibles.</div>
            ) : (
              availableServices.map((svc: any) => (
                <div key={svc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", marginRight: "0.5rem" }}>{svc.reference || "SIN REF"}</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>{svc.name}</span>
                  </div>
                  <button 
                    onClick={() => handleLink(svc.id)}
                    disabled={isLinking}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.75rem", borderRadius: "0.25rem", backgroundColor: "var(--surface-hover)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: isLinking ? "not-allowed" : "pointer", fontSize: "0.80rem", fontWeight: 500 }}
                  >
                    <Plus size={14} /> Vincular
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}
