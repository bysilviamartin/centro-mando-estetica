"use client";

import { useState } from "react";
import { Plus, Search, Eye, Edit2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EquipmentModal from "./EquipmentModal";

interface Equipment {
  id: string;
  name: string;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  active: boolean;
  notes?: string | null;
}

export default function EquipmentClient({ initialEquipments }: { initialEquipments: Equipment[] }) {
  const router = useRouter();
  const [equipments] = useState<Equipment[]>(initialEquipments);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const filteredEquipments = equipments.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ position: "relative", minWidth: "300px", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
          <input 
            type="text" 
            placeholder="Buscar aparatología por nombre..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem" }}
          />
        </div>

        <button 
          className="primary-button" 
          onClick={() => { setEditingEquipment(null); setShowModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> Nueva Aparatología
        </button>
      </div>

      <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
        {equipments.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-soft)" }}>
            <p style={{ marginBottom: "1rem" }}>No hay aparatología registrada en el centro.</p>
            <button className="primary-button" onClick={() => { setEditingEquipment(null); setShowModal(true); }}>
              Crear Nuevo Registro
            </button>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-soft)" }}>
            No se encontraron aparatos que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-hover)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Nombre del Equipo</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Fecha Compra</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "right" }}>Precio Compra</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "center" }}>Estado</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(eq => (
                  <tr key={eq.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s ease" }} className="hover:bg-[var(--surface-hover)]">
                    <td style={{ padding: "1rem 2rem" }}>
                      <Link href={`/settings/equipment/${eq.id}`} style={{ fontWeight: 600, color: "var(--foreground)", textDecoration: "none", fontSize: "0.95rem", display: "block" }}>
                        {eq.name}
                      </Link>
                    </td>
                    <td style={{ padding: "1rem 2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString("es-ES") : "No registrada"}
                    </td>
                    <td style={{ padding: "1rem 2rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "right", fontFamily: "monospace" }}>
                      {eq.purchasePrice ? `${eq.purchasePrice.toFixed(2)} €` : "-"}
                    </td>
                    <td style={{ padding: "1rem 2rem", textAlign: "center" }}>
                      <span style={{ 
                        display: "inline-block", 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "9999px", 
                        fontSize: "0.7rem", 
                        fontWeight: 600, 
                        backgroundColor: eq.active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                        color: eq.active ? "#4ade80" : "#f87171" 
                      }}>
                        {eq.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 2rem" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                        <button 
                          onClick={() => router.push(`/settings/equipment/${eq.id}`)}
                          style={{ padding: "0.5rem", borderRadius: "0.35rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                          title="Ver Ficha y Servicios"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingEquipment(eq); setShowModal(true); }}
                          style={{ padding: "0.5rem", borderRadius: "0.35rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Editar Equipo"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EquipmentModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); window.location.reload(); }} 
        equipment={editingEquipment} 
      />
    </>
  );
}
