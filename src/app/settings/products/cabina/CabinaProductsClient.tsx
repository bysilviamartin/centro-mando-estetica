"use client";

import { useState } from "react";
import { Search, Plus, Package, FileUp, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCabinaProduct, importCabinaProductsFromExcel } from "@/actions/cabina-products";
import * as XLSX from "xlsx";

export default function CabinaProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filtro sencillo (Nombre o Referencia)
  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (p.name && p.name.toLowerCase().includes(searchLower)) ||
           (p.reference && p.reference.toLowerCase().includes(searchLower));
  });

  async function handleCreateEmptyProduct() {
    setIsCreating(true);
    const newName = "Nuevo Producto Cabina " + Math.floor(Math.random() * 10000);
    const res = await createCabinaProduct({ name: newName });
    if (res.success && res.data) {
      router.push(`/settings/products/cabina/${res.data.id}`);
    } else {
      alert("Error creando producto de cabina: " + res.error);
      setIsCreating(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        
        const payload = [];
        
        // Hoja 2 (índice 1) - SkinIdent
        if (wb.SheetNames.length > 1) {
          const wsName2 = wb.SheetNames[1];
          const ws2 = wb.Sheets[wsName2];
          const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: "" }) as any[][];
          payload.push({ name: wsName2, index: 1, data: data2 });
        }
        
        // Hoja 4 (índice 3) - Baumann
        if (wb.SheetNames.length > 3) {
          const wsName4 = wb.SheetNames[3];
          const ws4 = wb.Sheets[wsName4];
          const data4 = XLSX.utils.sheet_to_json(ws4, { header: 1, defval: "" }) as any[][];
          payload.push({ name: wsName4, index: 3, data: data4 });
        }

        if (payload.length === 0) {
          alert("El archivo Excel no tiene hojas suficientes (requiere al menos la Hoja 2).");
          return setIsImporting(false);
        }

        const res = await importCabinaProductsFromExcel(payload);
        if (res.success) {
          alert(`Importación completada con éxito:\n\n- Productos creados: ${res.created}\n- Productos actualizados: ${res.updated}\n- Filas ignoradas: ${res.ignored}`);
          window.location.reload();
        } else {
          alert("Error importando productos: " + res.error);
          setIsImporting(false);
        }
      } catch (err) {
        alert("Error leyendo el archivo Excel o formato incorrecto.");
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
    e.target.value = "";
  };

  return (
    <div className="editorial-panel" style={{ padding: "1.5rem" }}>
      
      {/* HEADER ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        
        {/* FILTERS */}
        <div style={{ display: "flex", gap: "1rem", flex: "1 1 auto", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 250px", maxWidth: "400px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o referencia..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "0.6rem 1rem 0.6rem 2.5rem", 
                borderRadius: "var(--radius-md)", 
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "0.85rem"
              }}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          
          <input 
            type="file" 
            id="cabina-excel-upload" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: "none" }} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => document.getElementById("cabina-excel-upload")?.click()}
            disabled={isImporting}
            style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap",
              padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", 
              backgroundColor: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer",
              color: "var(--text-soft)", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
              opacity: isImporting ? 0.7 : 1
            }}
          >
            <FileUp size={16} /> {isImporting ? "Importando..." : "Importar productos cabina"}
          </button>

          <button 
            onClick={handleCreateEmptyProduct}
            disabled={isCreating}
            className="primary-button" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap", opacity: isCreating ? 0.7 : 1, padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
          >
            <Plus size={16} /> 
            {isCreating ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="editorial-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Referencia</th>
              <th style={{ width: "40%" }}>Nombre</th>
              <th style={{ width: "20%" }}>Capacidad</th>
              <th style={{ textAlign: "right", width: "10%" }}>Stock</th>
              <th style={{ width: "80px", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No se encontraron productos de cabina.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {p.reference || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-soft)", flexShrink: 0 }}>
                        <Package size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "0.9rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>
                          {p.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>
                    {p.capacity || "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ 
                      padding: "0.25rem 0.6rem", 
                      borderRadius: "9999px", 
                      fontSize: "0.80rem", 
                      fontWeight: 600,
                      backgroundColor: p.stock > 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: p.stock > 0 ? "#22c55e" : "#ef4444"
                    }}>
                      {p.stock} ud.
                    </span>
                  </td>
                  <td style={{ padding: "1rem 2rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <Link 
                        href={`/settings/products/cabina/${p.id}`} 
                        style={{ padding: "0.5rem", borderRadius: "0.35rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.2s" }} 
                        className="hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        title="Ver Ficha"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
