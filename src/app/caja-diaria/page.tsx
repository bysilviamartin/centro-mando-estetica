"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Save, Calculator, AlertCircle, RefreshCw, CreditCard, Banknote, Store } from "lucide-react";
import { getDailyCashData, saveDailyCashData } from "@/actions/daily-cash";
import { formatCurrency } from "@/lib/utils"; // If exists, or we use .toFixed(2)

export default function CajaDiariaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [calculated, setCalculated] = useState<any>(null);
  const [volveremosCash, setVolveremosCash] = useState<number>(0);
  const [volveremosCard, setVolveremosCard] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [hasSavedRecord, setHasSavedRecord] = useState(false);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await getDailyCashData(dateStr);
      if (res.success && res.data) {
        setCalculated(res.data.calculated);
        
        if (res.data.saved) {
          setVolveremosCash(Number(res.data.saved.volveremosCashAmount) || 0);
          setVolveremosCard(Number(res.data.saved.volveremosCardAmount) || 0);
          setNotes(res.data.saved.notes || "");
          setHasSavedRecord(true);
        } else {
          setVolveremosCash(0);
          setVolveremosCard(0);
          setNotes("");
          setHasSavedRecord(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!calculated) return;
    setSaving(true);
    try {
      const payload = {
        ...calculated,
        volveremosCashAmount: volveremosCash,
        volveremosCardAmount: volveremosCard,
        notes
      };
      
      const res = await saveDailyCashData(selectedDate, payload);
      if (res.success) {
        setHasSavedRecord(true);
        alert("Caja guardada correctamente");
      } else {
        alert("Error al guardar: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado al guardar caja.");
    } finally {
      setSaving(false);
    }
  };

  if (!calculated) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>;

  // Calculos Financieros 
  const totalVentas = 
    calculated.treatmentSales + 
    calculated.productSales + 
    calculated.voucherSales + 
    calculated.giftCardSales + 
    calculated.otherSales;

  const totalMovimientos = 
    calculated.cashAmount + 
    calculated.cardAmount + 
    calculated.transferAmount + 
    calculated.bizumAmount;

  // Ajustes
  const efectivoReal = calculated.cashAmount - volveremosCash;
  const tarjetaReal = calculated.cardAmount - volveremosCard;
  const diferencia = totalVentas - totalMovimientos;

  return (
    <div>
      <h1 className="page-title brand-font" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Store size={28} /> Caja Diaria
      </h1>
      <p className="page-subtitle">Revisión y cuadre de caja calculado desde Koibox</p>

      {/* Header & Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar color="var(--text-soft)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)'
            }}
          />
          <button 
            onClick={() => loadData(selectedDate)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            title="Recalcular"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {hasSavedRecord && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', borderLeft: '4px solid var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <AlertCircle color="var(--success)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--foreground)' }}>Caja ya guardada para este día</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '0.25rem' }}>
              Los totales de ventas provienen de Koibox, pero los ajustes manuales cargados provienen de tu último guardado.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout matches requested Tailwind styling via inline CSS because TW is missing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* TARJETA 1 */}
        <div style={{ 
          border: '1px solid var(--border)', 
          borderRadius: '0.75rem', 
          padding: '2rem',
          backgroundColor: 'var(--surface)'
        }}>
          <h2 className="brand-font" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator /> 1. Ventas Autocalculadas
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Servicios (Tratamientos)</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.treatmentSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Productos</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.productSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bonos</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.voucherSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tarjetas Regalo</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.giftCardSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Otros</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.otherSales.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>TOTAL VENTAS TEÓRICAS</span>
            <span className="brand-font" style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 600 }}>
              € {totalVentas.toFixed(2)}
            </span>
          </div>
        </div>

        {/* TARJETA 2 */}
        <div style={{ 
          border: '1px solid var(--border)', 
          borderRadius: '0.75rem', 
          padding: '2rem',
          backgroundColor: 'var(--surface)'
        }}>
          <h2 className="brand-font" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Banknote /> 2. Cobros Autocalculados
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Efectivo Bruto</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.cashAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tarjeta Bruta</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.cardAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transferencias</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.transferAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bizum</span>
              <span style={{ fontWeight: 600 }}>€ {calculated.bizumAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>TOTAL INGRESADO EN TPV</span>
            <span className="brand-font" style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 600 }}>
              € {totalMovimientos.toFixed(2)}
            </span>
          </div>
        </div>

        {/* TARJETA 3: Ajustes Manuales */}
        <div style={{ 
          border: '1px solid #f59e0b', 
          backgroundColor: 'rgba(251, 191, 36, 0.05)', 
          borderRadius: '0.75rem', 
          padding: '2rem'
        }}>
          <h2 className="brand-font" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard /> 3. Ajustes Manuales (Volveremos)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Escribe aquí qué parte del Efectivo Bruto o Tarjeta Bruta corresponde a la subvención Volveremos para descontarlo.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Volveremos (Efectivo)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={volveremosCash}
                onChange={(e) => setVolveremosCash(parseFloat(e.target.value) || 0)}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.25rem',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Volveremos (Tarjeta)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={volveremosCard}
                onChange={(e) => setVolveremosCard(parseFloat(e.target.value) || 0)}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.25rem',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>
        </div>

        {/* TARJETA 4: Cuadre Final */}
        <div style={{ 
          backgroundColor: '#171717', 
          borderRadius: '0.75rem', 
          padding: '2rem',
          border: '1px solid #2A2A2A'
        }}>
          <h2 className="brand-font" style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#fff' }}>
            4. Cuadre Final
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#222', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
              <p style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>Efectivo REAL en Cajón</p>
              <p className="brand-font" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                € {efectivoReal.toFixed(2)}
              </p>
            </div>
            <div style={{ backgroundColor: '#222', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
              <p style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>Tarjeta REAL en TPV</p>
              <p className="brand-font" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                € {tarjetaReal.toFixed(2)}
              </p>
            </div>
            <div style={{ backgroundColor: '#222', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
              <p style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>Otras Formas (Trf/Bz)</p>
              <p className="brand-font" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                € {(calculated.transferAmount + calculated.bizumAmount).toFixed(2)}
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e5e5e5' }}>Diferencia del Día</p>
              <p style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>Diferencia entre Ventas Teóricas y Cobros Reales</p>
            </div>
            <div style={{ 
              padding: '1rem 2rem', 
              borderRadius: '0.5rem', 
              border: '2px solid',
              borderColor: Math.abs(diferencia) > 0.05 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)',
              backgroundColor: Math.abs(diferencia) > 0.05 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            }}>
              <span className="brand-font" style={{ 
                fontSize: '2.25rem', 
                fontWeight: 'bold',
                color: Math.abs(diferencia) > 0.05 ? '#fbbf24' : '#34d399'
              }}>
                {diferencia > 0 ? "+" : ""}€ {diferencia.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0', marginBottom: '0.5rem' }}>Notas Generales / Justificación</label>
             <textarea 
               rows={3}
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Explica aquí incidencias o detalles del cierre..."
               style={{ 
                 width: '100%', 
                 backgroundColor: '#222', 
                 border: '1px solid #333', 
                 borderRadius: '0.5rem', 
                 padding: '1rem', 
                 color: '#fff', 
                 fontFamily: 'inherit',
                 marginBottom: '1.5rem',
                 resize: 'vertical'
               }}
             />
             
             <button
               onClick={handleSave}
               disabled={saving}
               style={{
                 width: '100%',
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 gap: '0.5rem',
                 backgroundColor: '#fbbf24',
                 color: '#451a03',
                 padding: '1rem',
                 borderRadius: '0.5rem',
                 fontWeight: 'bold',
                 fontSize: '1.1rem',
                 border: 'none',
                 cursor: saving ? 'not-allowed' : 'pointer',
                 opacity: saving ? 0.7 : 1,
                 transition: 'all 0.2s'
               }}
             >
               <Save size={20} />
               {saving ? "Guardando..." : "Confirmar y Cerrar Caja Diaria"}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
