"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Users, MoreVertical, X, UserPlus, Pencil, Trash2 } from "lucide-react";
import { getWorkers, createWorker, updateWorker, deleteWorker } from "@/actions/workers";

export default function WorkersSettingsPage() {
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    mobile: '',
    email: '',
    onboardDate: '',
    contractType: 'Indefinido',
    services: [] as string[],
    status: 'Activa'
  });
  
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadWorkers() {
      const res = await getWorkers();
      if (res.success) {
        setWorkers(res.workers || []);
      }
    }
    loadWorkers();
  }, []);

  const openNewWorkerModal = () => {
    setEditingId(null);
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      mobile: '',
      email: '',
      onboardDate: '',
      contractType: 'Indefinido',
      services: [],
      status: 'Activa'
    });
    setFormError('');
    setShowWorkerModal(true);
  };

  const openEditWorkerModal = (worker: any) => {
    setEditingId(worker.id);
    setFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      birthDate: worker.birthDate || '',
      mobile: worker.phone || '', // Map Prisma 'phone' to local 'mobile'
      email: worker.email || '',
      onboardDate: worker.hireDate || '', // Map Prisma 'hireDate' to local 'onboardDate'
      contractType: worker.contractType,
      services: [],
      status: worker.status
    });
    setFormError('');
    setShowWorkerModal(true);
    setOpenDropdownId(null);
  };

  const handleDeleteWorker = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta trabajadora?")) {
      const res = await deleteWorker(id);
      if (res.success) {
        const updated = await getWorkers();
        if (updated.success) {
          setWorkers(updated.workers || []);
        }
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
    setOpenDropdownId(null);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Nombre y apellidos son obligatorios.');
      return;
    }

    let res;
    if (editingId) {
      res = await updateWorker(editingId, formData);
    } else {
      res = await createWorker(formData);
    }
    if (res.success) {
      const updated = await getWorkers();
      if (updated.success) {
        setWorkers(updated.workers || []);
      }
      setShowWorkerModal(false);
    } else {
      setFormError(`Error al ${editingId ? 'actualizar' : 'crear'} la trabajadora: ` + res.error);
    }
  };

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
          <h1 className="page-title brand-font">Trabajadoras</h1>
          <p className="page-subtitle">Gestión del equipo, contratos y operativas asignadas</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={openNewWorkerModal}
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
            <Plus size={18} /> Nueva trabajadora
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* WORKER DIRECTORY */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} />
              Listado del Equipo
            </h2>
          </div>

          <div style={{ overflow: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Nombre Completo</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Tipo de contrato</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Contacto</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Estado</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserPlus size={24} color="var(--primary)" />
                        </div>
                        <p style={{ margin: 0 }}>No hay trabajadoras registradas en el centro.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {workers.map((worker) => (
                  <tr key={worker.id} style={{ borderBottom: '1px solid #2A2A2A', transition: 'background var(--transition)', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem 0', color: 'var(--foreground)', fontWeight: 500 }}>
                      <Link 
                        href={`/settings/workers/${worker.id}`}
                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {worker.firstName} {worker.lastName}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>
                      {worker.contractType}
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>{worker.phone || '—'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{worker.email || ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ 
                        color: worker.status === 'Activa' ? 'var(--primary)' : 'var(--text-muted)',
                        backgroundColor: worker.status === 'Activa' ? 'rgba(212, 175, 55, 0.1)' : '#1A1A1A',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {worker.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', position: 'relative' }}>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === worker.id ? null : worker.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdownId === worker.id && (
                        <div 
                          ref={dropdownRef}
                          style={{
                            position: 'absolute',
                            right: '2.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #2A2A2A',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            minWidth: '150px',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                          }}
                        >
                          <Link
                            href={`/settings/workers/${worker.id}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              width: '100%', padding: '0.65rem 0.75rem',
                              backgroundColor: 'transparent', border: 'none', color: 'var(--foreground)',
                              textAlign: 'left', cursor: 'pointer', borderRadius: '0.25rem',
                              fontSize: '0.85rem', transition: 'background var(--transition)',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <UserPlus size={15} /> Ver Ficha
                          </Link>
                          <button
                            onClick={() => handleDeleteWorker(worker.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              width: '100%', padding: '0.65rem 0.75rem',
                              backgroundColor: 'transparent', border: 'none', color: '#ef4444',
                              textAlign: 'left', cursor: 'pointer', borderRadius: '0.25rem',
                              fontSize: '0.85rem', transition: 'background var(--transition)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={15} /> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL: NUEVA TRABAJADORA */}
      {showWorkerModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          zIndex: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="editorial-panel" style={{ 
            width: '100%', 
            maxWidth: '700px', 
            padding: '2rem', 
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingId ? "Editar Trabajadora" : "Ficha de Trabajadora"}
              </h3>
              <button 
                onClick={() => setShowWorkerModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveWorker} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.35rem', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              {/* IDENTIFICACIÓN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Identificación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Laura" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Apellidos *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: García López" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de nacimiento</label>
                    <input 
                      type="date" 
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--text-soft)' }} 
                    />
                  </div>
                </div>
              </div>

              {/* CONTACTO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Contacto</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Móvil</label>
                    <input 
                      type="tel" 
                      placeholder="Ej: 600 123 456" 
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email</label>
                    <input 
                      type="email" 
                      placeholder="Ej: laura@ejemplo.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                    />
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN LABORAL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Información laboral</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de alta en empresa</label>
                    <input 
                      type="date" 
                      value={formData.onboardDate}
                      onChange={(e) => setFormData({...formData, onboardDate: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--text-soft)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo de contrato</label>
                    <select 
                      value={formData.contractType}
                      onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                    >
                      <option value="Indefinido">Indefinido</option>
                      <option value="Temporal">Temporal</option>
                      <option value="Media jornada">Media jornada</option>
                      <option value="Fijo discontinuo">Fijo discontinuo</option>
                      <option value="Prácticas">Prácticas / Formación</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Estado</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva / Baja</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* OPERATIVA (Placeholder) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#1A1A1A', borderRadius: '0.5rem', border: '1px solid #2A2A2A' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Operativa - Servicios capacitados</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', margin: 0 }}>
                  <span style={{ display: 'inline-block', backgroundColor: '#333', padding: '0.15rem 0.35rem', borderRadius: '0.2rem', marginRight: '0.5rem' }}>Próximamente</span>
                  El control de capacitación por operario se habilitará en la siguiente fase para restringir citas y rentabilidad.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingId ? "Guardar cambios" : "Crear ficha"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
