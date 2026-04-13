"use client";

import { useState } from "react";
import { Plus, Upload, Filter, Search, Edit2 } from "lucide-react";
import ServiceModal from "./ServiceModal";
import ImportServicesModal from "./ImportServicesModal";

interface Service {
  id: string;
  reference?: string | null;
  name: string;
  price: number;
  duration?: number | null;
  category?: string | null;
  taxRate?: number | null;
  employees?: string | null;
  active: boolean;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  status: string;
}

export default function ServicesClient({ initialServices, workers = [] }: { initialServices: Service[], workers?: Worker[] }) {
  const [services] = useState<Service[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");
  const [filterWorker, setFilterWorker] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  // Derive unique categories for dropdowns
  const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean))) as string[];
  uniqueCategories.sort();

  const filteredServices = services.filter(s => {
    // Text search
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (s.reference && s.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Filters
    if (filterCategory !== "ALL" && s.category !== filterCategory) return false;
    if (filterActive !== "ALL") {
      const wantActive = filterActive === "ACTIVE";
      if (s.active !== wantActive) return false;
    }
    
    // Worker Filter
    if (filterWorker !== "ALL") {
      if (!s.employees) return false;
      const emails = s.employees.split(/[,;\n]+/).map(e => e.trim().toLowerCase());
      if (!emails.includes(filterWorker.toLowerCase())) return false;
    }

    return true;
  });

  // Active workers for the dropdown
  const activeWorkers = workers.filter(w => w.status === 'Activa' && w.email);

  return (
    <>
      {/* Controls Container */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Search & Filters */}
        <div style={{ display: "flex", gap: "1rem", flex: 2, minWidth: "300px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "250px", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
            <input 
              type="text" 
              placeholder="Buscar servicio o referencia..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.9rem", transition: "all 0.2s ease" }}
            />
          </div>
          
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", flex: 1, minWidth: "150px" }}
          >
            <option value="ALL">Todas las categorías</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterActive} 
            onChange={e => setFilterActive(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", width: "130px" }}
          >
            <option value="ALL">Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>

          <select 
            value={filterWorker} 
            onChange={e => setFilterWorker(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", flex: 1, minWidth: "150px" }}
          >
            <option value="ALL">Todas las trabajadoras</option>
            {activeWorkers.map(w => (
              <option key={w.id} value={w.email || ""}>
                {w.firstName} {w.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className="secondary-button" 
            onClick={() => setShowImportModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Upload size={16} /> Importar Excel
          </button>
          <button 
            className="primary-button" 
            onClick={() => { setServiceToEdit(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Plus size={16} /> Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="editorial-panel" style={{ padding: "0", overflow: "hidden" }}>
        {services.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-soft)" }}>
            <p style={{ marginBottom: "1rem" }}>No hay servicios en el catálogo.</p>
            <button className="primary-button" onClick={() => setShowImportModal(true)}>
              Importar desde Koibox
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-soft)" }}>
            No se encontraron servicios que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-hover)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Referencia</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Servicio</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Categoría</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "right" }}>Precio</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "center" }}>Estado</th>
                  <th style={{ padding: "1.25rem 2rem", fontSize: "0.7rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(service => (
                  <tr key={service.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s ease" }}>
                    <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {service.reference || "-"}
                    </td>
                    <td style={{ padding: "1rem 2rem" }}>
                      <div style={{ fontWeight: "500", color: "var(--foreground)", marginBottom: "0.25rem" }}>{service.name}</div>
                      {service.duration && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{service.duration} min</div>}
                    </td>
                    <td style={{ padding: "1rem 2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {service.category || "Sin Categoría"}
                    </td>
                    <td style={{ padding: "1rem 2rem", fontSize: "0.9rem", color: "var(--foreground)", fontWeight: "600", textAlign: "right", fontFamily: "var(--font-montserrat)" }}>
                      € {service.price.toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "999px", 
                        fontSize: "0.7rem", 
                        fontWeight: "600", 
                        backgroundColor: service.active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                        color: service.active ? "var(--success)" : "var(--error)" 
                      }}>
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 2rem", textAlign: "center" }}>
                      <button 
                        onClick={() => { setServiceToEdit(service); setShowModal(true); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)", padding: "0.5rem", borderRadius: "var(--radius-sm)", transition: "all 0.2s ease" }}
                        title="Editar Servicio"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal 
          onClose={() => setShowModal(false)} 
          initialData={serviceToEdit} 
          categories={uniqueCategories}
        />
      )}

      {showImportModal && (
        <ImportServicesModal 
          onClose={() => setShowImportModal(false)} 
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}
