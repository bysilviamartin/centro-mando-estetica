"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";
import { processImport } from "@/actions/import";

export default function ImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"ventas" | "movimientos">("ventas");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullImportData, setFullImportData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportStatus("idle");
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        
        let initialPreview: any[] = [];
        let rawDataForServer: any = null;

        if (fileType === "ventas") {
          if (wb.SheetNames.length < 3) {
            setErrorMessage("El archivo de ventas debe tener al menos 3 hojas (General, Por empleado, Sin desglosar).");
            setImportStatus("error");
            return;
          }

          const ws0 = wb.Sheets[wb.SheetNames[0]]; // General
          const ws1 = wb.Sheets[wb.SheetNames[1]]; // Por empleado
          const ws2 = wb.Sheets[wb.SheetNames[2]]; // Sin desglosar

          const data0 = XLSX.utils.sheet_to_json(ws0, { header: 1, defval: "" }) as any[][];
          const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: "" }) as any[][];
          const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: "" }) as any[][];

          rawDataForServer = { sheet0: data0, sheet1: data1, sheet2: data2 };

          // Previsualización (Exclusiva Hoja 1)
          const validGeneralRows = data0.filter((row, i) => {
             if (i < 3 && !row[7]) return false; // saltar posibles preámbulos
             const concepto = row[7]?.toString().trim();
             const totalStr = row[16]?.toString();
             // Condiciones: Concepto no vacío, Total numérico (no chequeamos validación estricta numérica aquí, solo q exista),
             // NO sea fila "Total Ticket" o "Totales" o vacía.
             if (!concepto) return false;
             if (!totalStr) return false;
             const isTotalTicket = concepto.toLowerCase().includes("total ticket");
             const isTotales = concepto.toLowerCase().includes("totales");
             return !isTotalTicket && !isTotales;
          });

          initialPreview = validGeneralRows.map(row => ({
            Fecha: row[0],
            Ticket: row[1],
            Concepto: row[7],
            Total: row[16]
          }));

        } else {
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          rawDataForServer = data;
          initialPreview = data;
        }

        setFullImportData(rawDataForServer);
        setPreviewData(initialPreview.slice(0, 50));
      } catch (err) {
        setErrorMessage("Error leyendo el archivo Excel.");
        setImportStatus("error");
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleConfirmImport = async () => {
    if (!fullImportData || !file) return;
    setIsProcessing(true);

    try {
      const result = await processImport(fullImportData, file.name, fileType);
      
      if (result.success) {
        setImportStatus("success");
      } else {
        setImportStatus("error");
        setErrorMessage(result.error || "Error al guardar los datos.");
      }
    } catch (e: any) {
      setImportStatus("error");
      setErrorMessage(e.message || "Error fatal.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (importStatus === "success") {
    return (
      <div className="editorial-panel" style={{ textAlign: "center", padding: "3rem 2rem", width: "100%" }}>
        <CheckCircle size={48} color="var(--success)" style={{ margin: "0 auto" }} />
        <h3 className="brand-font" style={{ fontSize: "1.25rem", margin: "1rem 0" }}>¡Importación Exitosa!</h3>
        <button 
          onClick={() => { setImportStatus("idle"); setFile(null); setPreviewData([]); }}
          style={{ 
            backgroundColor: "var(--primary)", color: "var(--surface)", 
            padding: "0.75rem 1.5rem", border: "none", cursor: "pointer",
            fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", textTransform: "uppercase"
          }}
        >
          Nueva Importación
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {/* 1. Fila superior: selectores + botón Importar */}
      <div className="editorial-panel" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", flexWrap: "wrap" }}>
        
        {/* Selector de Tipo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "0.5rem" }}>1. Tipo</span>
          <button 
            onClick={() => { setFileType("ventas"); setPreviewData([]); }}
            style={{ padding: "0.5rem 1rem", backgroundColor: fileType === "ventas" ? "var(--accent-foreground)" : "var(--surface)", color: fileType === "ventas" ? "#000" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", fontSize: "0.85rem" }}
          >
            VENTAS
          </button>
          <button 
            onClick={() => { setFileType("movimientos"); setPreviewData([]); }}
            style={{ padding: "0.5rem 1rem", backgroundColor: fileType === "movimientos" ? "var(--primary)" : "var(--surface)", color: fileType === "movimientos" ? "var(--surface)" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", fontSize: "0.85rem" }}
          >
            MOVIMIENTOS
          </button>
        </div>

        {/* Separador */}
        <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border)", margin: "0 0.5rem" }} />

        {/* Input de archivo Dummy */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
          <span style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "0.5rem" }}>2. Archivo</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.5rem 1rem", color: file ? "var(--foreground)" : "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <FileSpreadsheet size={16} />
               {file ? file.name : `Selecciona un Excel de ${fileType === "ventas" ? "Ventas" : "Movimientos"}...`}
          </div>
        </div>

        {/* Botón Importar real (abre selector) */}
        <div>
          <button 
             onClick={() => document.getElementById("excel-upload")?.click()}
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--foreground)", color: "var(--background)", padding: "0.65rem 1.5rem", borderRadius: "100px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", whiteSpace: "nowrap" }}
          >
            <Upload size={16} /> Importar Excel
          </button>
          <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </div>

      {importStatus === "error" && (
        <div style={{ padding: "1rem", backgroundColor: "var(--danger-bg)", color: "var(--danger)", fontSize: "0.85rem", borderRadius: "var(--radius-md)" }}>
          <AlertCircle size={16} style={{ display: "inline", marginRight: "0.5rem" }} /> {errorMessage}
        </div>
      )}

      {/* 2. Botón Confirmar importación debajo */}
      {previewData.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--primary)", borderLeft: "4px solid var(--primary)" }}>
          <div>
            <h3 className="brand-font" style={{ fontSize: "1.1rem", margin: "0 0 0.25rem 0", color: "var(--primary)" }}>Paso Final: Confirmar</h3>
            <p style={{ fontSize: "0.80rem", color: "var(--text-soft)", margin: 0 }}>Revisa la tabla de previsualización antes de confirmar.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isProcessing && <span style={{ color: "var(--accent-foreground)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><RefreshCcw size={14} className="animate-spin" /> Procesando...</span>}
            <button 
              onClick={handleConfirmImport} 
              disabled={isProcessing} 
              style={{ backgroundColor: "var(--primary)", color: "var(--surface)", padding: "0.75rem 2.5rem", borderRadius: "100px", border: "none", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", opacity: isProcessing ? 0.7 : 1, transition: "all 0.2s" }}
            >
              Confirmar Importación
            </button>
          </div>
        </div>
      )}

      {/* 3. Tabla de previsualización (ancho completo) */}
      <div className="editorial-panel" style={{ overflow: "hidden", width: "100%" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-hover)" }}>
          <h3 className="label-text" style={{ margin: 0 }}>Previsualización de Datos ({fileType})</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{previewData.length} filas listadas</span>
        </div>

        {previewData.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-soft)" }}>
            <FileSpreadsheet size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.2 }} />
            Esperando archivo Excel...
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: "400px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <thead>
                {fileType === "ventas" ? (
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", backgroundColor: "var(--surface)", position: "sticky", top: 0 }}>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Fecha</th>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Ticket</th>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Concepto</th>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", textAlign: "right", color: "var(--text-muted)" }}>Total</th>
                  </tr>
                ) : (
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", backgroundColor: "var(--surface)", position: "sticky", top: 0 }}>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Fecha</th>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Descripción</th>
                    <th style={{ padding: "1rem", fontSize: "0.7rem", textTransform: "uppercase", textAlign: "right", color: "var(--text-muted)" }}>Importe</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {previewData.map((row, i) => {
                  if (fileType === "ventas") {
                    const rawDate = row["Fecha"];
                    const displayDate = rawDate instanceof Date ? rawDate.toLocaleDateString() : rawDate ? String(rawDate).slice(0, 10) : '-';
                    const displayTicket = row["Ticket"] || '-';
                    const displayDesc = row["Concepto"] || '-';
                    const displayAmt = row["Total"] !== undefined && row["Total"] !== "" ? String(row["Total"]) : '-';

                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--surface-hover)" }} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{displayDate}</td>
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--foreground)" }}>{displayTicket}</td>
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--foreground)" }}>{displayDesc}</td>
                        <td className="brand-font" style={{ padding: "1rem", fontSize: "1rem", textAlign: "right", fontWeight: 500, color: "var(--foreground)" }}>{displayAmt}</td>
                      </tr>
                    );
                  } else {
                    const rawDate = row["Fecha"] || row["Date"] || row["Data"];
                    const displayDate = rawDate instanceof Date ? rawDate.toLocaleDateString() : rawDate ? String(rawDate).slice(0, 10) : '-';
                    const displayDesc = row["Descripción"] || row["Concepto"] || row["Articulo"] || row["Servicio/Producto"] || '-';
                    const displayAmt = row["Importe"] || row["Total"] || row["Importe total"] || '-';

                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--surface-hover)" }} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{displayDate}</td>
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--foreground)" }}>{displayDesc}</td>
                        <td className="brand-font" style={{ padding: "1rem", fontSize: "1rem", textAlign: "right", fontWeight: 500, color: "var(--foreground)" }}>{displayAmt}</td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
