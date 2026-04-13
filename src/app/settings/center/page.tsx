"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";

export default function CenterSettingsPage() {
  return (
    <div className="space-y-10">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link 
            href="/settings" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textDecoration: 'none',
              transition: 'color var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ChevronLeft size={16} /> Volver a Ajustes
          </Link>
          <h1 className="page-title brand-font">Centro</h1>
          <p className="page-subtitle">Configuración de los datos principales y públicos del establecimiento</p>
        </div>
        
        {/* Fake Save Button to complete the UI feel even if not functional yet */}
        <button 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: '#000',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Save size={18} /> Guardar Cambios
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. IDENTIDAD */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            1. Identidad
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre comercial</label>
              <input type="text" placeholder="Ej: Silvia Martín Inteligencia Financiera" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Razón social</label>
              <input type="text" placeholder="Ej: Silvia Martín SL" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CIF / NIF</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dirección fiscal / local</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Código Postal</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ciudad</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Provincia</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
          </div>
        </section>

        {/* 2. CONTACTO */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            2. Contacto y Redes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Teléfono Fijo</label>
              <input type="tel" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>WhatsApp de empresa</label>
              <input type="tel" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email principal</label>
              <input type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sitio Web</label>
              <input type="url" placeholder="https://" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Instagram</label>
              <input type="text" placeholder="@usuario" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Facebook</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>YouTube</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Comunidad de WhatsApp (Link)</label>
              <input type="url" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
          </div>
        </section>

        {/* 3. HORARIO */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            3. Horario Base
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Días de apertura</label>
              <input type="text" placeholder="Ej: Lunes a Viernes" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', maxWidth: '400px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Hora de apertura</label>
              <input type="time" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Hora de cierre</label>
              <input type="time" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
          </div>
        </section>

        {/* 4. INSTALACIONES */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            4. Instalaciones
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Número de cabinas (Total)</label>
              <input type="number" min="0" defaultValue="1" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }} />
            </div>
          </div>
        </section>

        {/* 5. CONFIGURACIÓN GENERAL */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            5. Configuración General del Sistema
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Moneda Principal</label>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }}>
                <option value="EUR">€ - Euro (EUR)</option>
                <option value="USD">$ - Dólar (USD)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Zona Horaria</label>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }}>
                <option value="Europe/Madrid">Europa / Madrid</option>
                <option value="Europe/London">Europa / Londres</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Idioma Principal</label>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem' }}>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
