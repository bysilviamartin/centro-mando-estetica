import { useState } from "react";
import { Plus, Trash2, Link } from "lucide-react";

export interface DocumentEntry {
  name: string;
  url: string;
}

export default function DocumentInput({ documents, onChange }: { documents: DocumentEntry[], onChange: (docs: DocumentEntry[]) => void }) {
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addDocument = () => {
    if (newName.trim() && newUrl.trim()) {
      onChange([...documents, { name: newName.trim(), url: newUrl.trim() }]);
      setNewName("");
      setNewUrl("");
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    onChange(newDocs);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", marginBottom: "0.5rem" }}>
        Documentos de Respaldo Excepcionales
      </label>
      
      {documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          {documents.map((doc, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                <Link size={14} style={{ color: "var(--text-soft)", flexShrink: 0 }} />
                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "var(--accent-foreground)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {doc.name}
                </a>
              </div>
              <button type="button" onClick={() => removeDocument(idx)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "0.25rem" }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Nombre (Ej: Factura Proveedor)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
        />
        <input
          type="url"
          placeholder="Enlace (https://...)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
        />
        <button
          type="button"
          onClick={addDocument}
          disabled={!newName.trim() || !newUrl.trim()}
          style={{ padding: "0.5rem 1rem", backgroundColor: "var(--accent-foreground)", color: "var(--accent)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={16} /> Añadir
        </button>
      </div>
    </div>
  );
}
