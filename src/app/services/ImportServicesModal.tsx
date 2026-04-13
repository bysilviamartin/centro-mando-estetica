"use client";

import { useState } from "react";
import { X, Upload, FileType, CheckCircle, AlertTriangle } from "lucide-react";
import * as xlsx from "xlsx";
import { importServices } from "@/actions/services";

interface ImportServicesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportServicesModal({ onClose, onSuccess }: ImportServicesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = xlsx.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          // Leer como array de arrays para saltar las dos primeras filas de texto de Koibox
          const dataArrays = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          if (dataArrays.length < 4) {
             throw new Error("El archivo no tiene el formato esperado (muy pocas filas).");
          }

          // La fila 2 (índice 2) son los encabezados reales
          const headers = dataArrays[2] as string[];
          
          // Reconstruir los objetos desde la fila 3 (índice 3) en adelante
          const data = dataArrays.slice(3).map(row => {
             const obj: any = {};
             headers.forEach((h, i) => {
               if (h) obj[h] = row[i];
             });
             return obj;
          });

          if (data.length === 0) {
            throw new Error("No se encontraron datos de servicios tras los encabezados.");
          }
          
          setParsedData(data);
        } catch (err: any) {
          setError("Error al leer el archivo Excel. Asegúrate de que es un archivo de exportación de Koibox (.xls, .xlsx). " + err.message);
          setFile(null);
          setParsedData(null);
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const mapKoiboxHeadersToSchema = (rawRow: any) => {
    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (rawRow[k] !== undefined && rawRow[k] !== null && rawRow[k] !== "") return rawRow[k];
      }
      return null;
    };

    // La duración de Koibox viene como fracción de día (ej: 0.0416666 = 1 hora)
    const rawDuration = getVal(["Duración (00:00:00)*", "Duración", "duracion", "duración", "Duration"]);
    let parsedDuration = null;
    if (typeof rawDuration === 'number') {
      // Convertir fracción de día a minutos (1 día = 1440 minutos)
      parsedDuration = Math.round(rawDuration * 1440);
    } else if (typeof rawDuration === 'string' && rawDuration.includes(':')) {
       // Si por casualidad viene como string "01:00"
       const parts = rawDuration.split(':');
       if (parts.length >= 2) {
         parsedDuration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
       }
    } else if (rawDuration) {
       parsedDuration = parseInt(rawDuration);
    }

    return {
      reference: getVal(["Referencia*", "Referencia", "referencia", "Ref"]),
      name: getVal(["Servicio*", "Servicio", "servicio", "Name", "Nombre"]),
      price: parseFloat(getVal(["Precio", "precio", "Price"]) || 0),
      duration: parsedDuration,
      category: getVal(["Categoría*", "Categoría", "categoria", "Categoria"]),
      taxRate: parseFloat(getVal(["Impuesto", "impuesto", "Tax", "IVA"]) || 21),
      active: getVal(["Activo", "activo", "Active"]) === false || getVal(["Activo", "activo", "Active"]) === "NO" ? false : true,
      employees: getVal(["Empleados (Email separados por ,)", "Empleados", "empleados"])
    };
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    setError(null);

    try {
      const mappedServices = parsedData.map(mapKoiboxHeadersToSchema).filter(s => s.name); // Ignore rows without a name

      const res = await importServices(mappedServices);

      if (res.success) {
        setSuccess(`¡Importación exitosa! Se procesaron ${res.count} servicios del catálogo.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        throw new Error(res.error || "Error al insertar en la base de datos.");
      }
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div className="editorial-panel" style={{ width: "95%", maxWidth: "600px", padding: "0", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--background)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
          <h2 className="brand-font" style={{ fontSize: "1.25rem" }}>Importar Catálogo Koibox</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ padding: "1.5rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", textAlign: "center", backgroundColor: "var(--surface-hover)", cursor: "pointer", position: "relative" }}>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileUpload} 
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            />
            <FileType size={32} style={{ color: "var(--accent-foreground)", margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              {file ? file.name : "Sube el Excel de Servicios"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Exporta tus listados de Koibox y súbelos tal cual aquí. Detectaremos los campos automáticamente.
            </p>
          </div>

          {error && (
            <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--error)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600" }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {parsedData && !error && !success && (
             <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
               <h4 style={{ fontSize: "0.85rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Resumen de Lectura</h4>
               <p style={{ fontSize: "0.95rem", color: "var(--foreground)"}}>
                 Se han detectado <strong>{parsedData.length}</strong> servicios en el archivo. Listos para volcar a la base de datos.
               </p>
             </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "1rem", backgroundColor: "var(--background)", borderBottomLeftRadius: "var(--radius-lg)", borderBottomRightRadius: "var(--radius-lg)" }}>
          <button type="button" onClick={onClose} className="secondary-button" disabled={isProcessing}>Cancelar</button>
          <button type="button" onClick={handleImport} className="primary-button" disabled={!parsedData || isProcessing} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={16} /> {isProcessing ? "Importando..." : "Importar Catálogo"}
          </button>
        </div>

      </div>
    </div>
  );
}
