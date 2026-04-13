"use client";

import { useState } from "react";
import { Search, Plus, Package, FileUp, Filter, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProduct, importProductsFromExcel } from "@/actions/products";
import * as XLSX from "xlsx";

export default function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLine, setSearchLine] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const enrichedProducts = products.map(p => {
    let parsedBrand = "";
    let parsedLine = p.line || "";
    let parsedName = p.name || "";
    if (p.name && p.name.includes("|")) {
      const parts = p.name.split("|").map((s: string) => s.trim());
      if (parts.length >= 3) {
        parsedBrand = parts[0];
        parsedLine = parts[1];
        parsedName = parts.slice(2).join(" | ");
      } else {
        parsedName = p.name;
      }
    } else {
      parsedName = p.name;
    }
    return { ...p, parsedBrand, parsedLine, parsedName };
  });

  // Derive unique lines and suppliers for the filter dropdowns
  const uniqueLines = Array.from(new Set(enrichedProducts.map(p => p.parsedLine).filter(Boolean))).sort();
  const uniqueSuppliers = Array.from(new Set(enrichedProducts.map(p => p.supplier).filter(Boolean))).sort();

  const filteredProducts = enrichedProducts.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = p.parsedName.toLowerCase().includes(searchLower) || 
                       p.name.toLowerCase().includes(searchLower) ||
                       (p.parsedBrand && p.parsedBrand.toLowerCase().includes(searchLower)) ||
                       (p.reference && p.reference.toLowerCase().includes(searchLower));
    const matchesLine = searchLine ? p.parsedLine === searchLine : true;
    const matchesSupplier = searchSupplier ? p.supplier === searchSupplier : true;
    
    return matchesName && matchesLine && matchesSupplier;
  });

  async function handleCreateEmptyProduct() {
    setIsCreating(true);
    const newName = "Nuevo Producto " + Math.floor(Math.random() * 10000);
    const res = await createProduct({ name: newName });
    if (res.success && res.data) {
      router.push(`/settings/products/${res.data.id}`);
    } else {
      alert("Error creando producto: " + res.error);
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
        
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        if (rawData.length <= 3) {
          alert("El archivo Excel no tiene el formato correcto de Koibox (se requieren datos a partir de la fila 4).");
          return setIsImporting(false);
        }

        const res = await importProductsFromExcel(rawData);
        if (res.success) {
          alert(`Importación completada con éxito:\n\n- Productos creados: ${res.rowsCreated}\n- Productos actualizados: ${res.rowsUpdated}\n- Filas ignoradas: ${res.rowsIgnored}\n\nMotivo principal de descarte: ${res.ignoredReason || 'Datos incompletos'}`);
          window.location.reload();
        } else {
          alert("Error importando productos: " + res.error);
          setIsImporting(false);
        }
      } catch (err) {
        alert("Error leyendo el archivo Excel.");
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
    // Reset input
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

          <div style={{ position: "relative", minWidth: "150px" }}>
             <Filter size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", pointerEvents: "none" }} />
             <select
               value={searchLine}
               onChange={(e) => setSearchLine(e.target.value)}
               style={{
                 width: "100%", 
                 padding: "0.6rem 2rem 0.6rem 2rem", 
                 borderRadius: "var(--radius-md)", 
                 border: "1px solid var(--border)",
                 backgroundColor: "var(--surface)",
                 color: "var(--foreground)",
                 fontSize: "0.85rem",
                 outline: "none",
                 appearance: "none",
                 cursor: "pointer"
               }}
             >
               <option value="">Línea / Gama (Todas)</option>
               {uniqueLines.map(line => (
                 <option key={line} value={line}>{line}</option>
               ))}
             </select>
          </div>

          <div style={{ position: "relative", minWidth: "150px" }}>
             <Filter size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", pointerEvents: "none" }} />
             <select
               value={searchSupplier}
               onChange={(e) => setSearchSupplier(e.target.value)}
               style={{
                 width: "100%", 
                 padding: "0.6rem 2rem 0.6rem 2rem", 
                 borderRadius: "var(--radius-md)", 
                 border: "1px solid var(--border)",
                 backgroundColor: "var(--surface)",
                 color: "var(--foreground)",
                 fontSize: "0.85rem",
                 outline: "none",
                 appearance: "none",
                 cursor: "pointer"
               }}
             >
               <option value="">Proveedor (Todos)</option>
               {uniqueSuppliers.map(sup => (
                 <option key={sup} value={sup}>{sup}</option>
               ))}
             </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          
          <input 
            type="file" 
            id="products-excel-upload" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: "none" }} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => document.getElementById("products-excel-upload")?.click()}
            disabled={isImporting}
            style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap",
              padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", 
              backgroundColor: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer",
              color: "var(--text-soft)", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
              opacity: isImporting ? 0.7 : 1
            }}
          >
            <FileUp size={16} /> {isImporting ? "Importando..." : "Importar productos de venta"}
          </button>

          <button 
            onClick={handleCreateEmptyProduct}
            disabled={isCreating}
            className="primary-button" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap", opacity: isCreating ? 0.7 : 1, padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
          >
            <Plus size={16} /> 
            {isCreating ? "Creando..." : "Crear Producto"}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="editorial-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Referencia</th>
              <th style={{ width: "30%" }}>Nombre</th>
              <th style={{ width: "15%" }}>Línea</th>
              <th style={{ width: "15%" }}>Proveedor</th>
              <th style={{ textAlign: "right" }}>Stock</th>
              <th style={{ textAlign: "right" }}>P. Venta</th>
              <th style={{ width: "80px", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No se encontraron productos.
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
                        {p.parsedBrand && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.15rem" }}>
                            {p.parsedBrand}
                          </div>
                        )}
                        <div style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "0.9rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.parsedName}>
                          {p.parsedName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>
                    {p.parsedLine || "—"}
                  </td>
                  <td style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>
                    {p.supplier || "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "9999px", 
                      fontSize: "0.80rem", 
                      fontWeight: 600,
                      backgroundColor: p.stock > (p.minimumStock || 0) ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: p.stock > (p.minimumStock || 0) ? "#22c55e" : "#ef4444"
                    }}>
                      {p.stock} ud.
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--foreground)", fontWeight: 500 }}>
                    {p.salePrice ? `${p.salePrice.toFixed(2)} €` : "—"}
                  </td>
                  <td style={{ padding: "1rem 2rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <Link 
                        href={`/settings/products/${p.id}`} 
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
