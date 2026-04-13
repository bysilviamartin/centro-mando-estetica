"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, MoreVertical, CalendarPlus, X, Edit2, Trash2 } from "lucide-react";
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getWorkerVacationsForCalendar, getWorkerAbsencesForCalendar } from "@/actions/calendar";

export default function CalendarSettingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Start on current real date
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]); // Empty events array ready to hold data locally
  const [isLoading, setIsLoading] = useState(true);
  
  // Track open dropdowns by event ID
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Ref for clicking outside to close
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'FESTIVO_CERRADO',
    title: '',
    startDate: '',
    endDate: '',
    recurrence: 'NONE',
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterWorkers, setFilterWorkers] = useState<string[]>([]);
  const [filterOrigin, setFilterOrigin] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Activo'); // Default to 'Activo' globally to hide cancelled by default

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterTypes([]);
    setFilterWorkers([]);
    setFilterOrigin('Todos');
    setFilterStatus('Activo');
  };

  const getUniqueWorkersList = () => {
    const workerIds = Array.from(new Set(events.filter(e => e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA').map(e => e.workerId)));
    return workerIds.map((workerId: string) => {
      const evt = events.find(e => (e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA') && e.workerId === workerId);
      const nameMatch = evt?.title.split(': ');
      return {
        id: workerId,
        name: nameMatch ? nameMatch[1] : 'Desconocido'
      };
    });
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Ajustar para que el Lunes sea el primer día de la semana (0) y Domingo el último (6)
  const startingEmptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const years = Array.from({ length: 7 }, (_, i) => 2024 + i);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      
      const [calRes, vacRes, absRes] = await Promise.all([
        getCalendarEvents(),
        getWorkerVacationsForCalendar(),
        getWorkerAbsencesForCalendar()
      ]);

      let mergedEvents: any[] = [];
      
      if (calRes.success && calRes.events) {
        mergedEvents = [...mergedEvents, ...calRes.events];
      } else {
        console.error("No se pudieron cargar los eventos del centro");
      }
      
      if (vacRes.success && vacRes.vacations) {
        mergedEvents = [...mergedEvents, ...vacRes.vacations];
      } else {
        console.error("No se pudieron cargar las vacaciones de las trabajadoras");
      }

      if (absRes.success && absRes.absences) {
        mergedEvents = [...mergedEvents, ...absRes.absences];
      } else {
        console.error("No se pudieron cargar las ausencias de las trabajadoras");
      }

      setEvents(mergedEvents);
      setIsLoading(false);
    };
    loadEvents();
  }, []);

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

  // Deterministic color generation based on Worker ID
  // Fast string hash function for JS
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  // Predefined beautiful distinct palette for Workers avoiding Center's colors
  const workerColors = [
    '#0ea5e9', // Sky blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#d946ef', // Fuchsia
    '#84cc16', // Lime
    '#06b6d4'  // Cyan
  ];

  const getWorkerColor = (workerId: string) => {
    const cleanId = workerId.replace('worker-vacation-', ''); // In case the ID comes modified
    const hash = Math.abs(getHash(cleanId));
    return workerColors[hash % workerColors.length];
  };

  const getTypeColor = (event: any) => {
    if (event.type === 'VACACIONES_TRABAJADORA' || event.type === 'AUSENCIA_TRABAJADORA') {
      return getWorkerColor(event.workerId);
    }
    
    switch(event.type) {
      case 'FESTIVO_CERRADO': return '#ef4444'; // red
      case 'PUENTE_CERRADO': return '#f97316'; // orange
      case 'VACACIONES_CENTRO': return '#3b82f6'; // blue
      case 'CIERRE_EXTRAORDINARIO': return '#6b7280'; // gray
      case 'APERTURA_EXTRAORDINARIA': return '#10b981'; // green
      case 'EVENTO_INTERNO': return '#a855f7'; // purple
      default: return 'var(--primary)'; // gold
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'VACACIONES_TRABAJADORA') return 'Vacaciones trabajadora';
    if (type === 'AUSENCIA_TRABAJADORA') return 'Ausencia trabajadora';
    switch(type) {
      case 'FESTIVO_CERRADO': return 'Festivo cerrado';
      case 'PUENTE_CERRADO': return 'Puente cerrado';
      case 'VACACIONES_CENTRO': return 'Vacaciones del centro';
      case 'CIERRE_EXTRAORDINARIO': return 'Cierre extraordinario';
      case 'APERTURA_EXTRAORDINARIA': return 'Apertura extraordinaria';
      case 'EVENTO_INTERNO': return 'Evento interno';
      default: return 'Evento';
    }
  };

  const openNewEventModal = () => {
    setEditingId(null);
    setFormData({
      type: 'FESTIVO_CERRADO',
      title: '',
      startDate: '',
      endDate: '',
      recurrence: 'NONE',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowEventModal(true);
  };

  const openEditEventModal = (eventToEdit: any) => {
    setOpenDropdownId(null);
    setEditingId(eventToEdit.id);
    setFormData({
      type: eventToEdit.type,
      title: eventToEdit.title,
      // Date strings coming directly from the server are in 'YYYY-MM-DD' format, 
      // which is exactly what the <input type="date"> expects.
      startDate: eventToEdit.startDate,
      endDate: eventToEdit.endDate,
      recurrence: eventToEdit.recurrence,
      status: eventToEdit.status
    });
    setFormError('');
    setShowEventModal(true);
  };
  
  const handleDeleteEvent = async (id: string) => {
    setOpenDropdownId(null);
    if (!window.confirm("¿Seguro que quieres eliminar este evento?")) return;
    
    const res = await deleteCalendarEvent(id);
    if (res.success) {
      // Optimistic visual wipe
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      alert("Error al eliminar el evento: " + res.error);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('La descripción del evento es obligatoria.');
      return;
    }
    if (!formData.startDate) {
      setFormError('La fecha de inicio es obligatoria.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = formData.endDate ? new Date(formData.endDate) : start;

    if (end < start) {
      setFormError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    let res;
    if (editingId) {
       res = await updateCalendarEvent(editingId, formData);
    } else {
       res = await createCalendarEvent(formData);
    }
    
    if (res.success) {
      // Reload everything to maintain clean state including Worker Vacations
      const [calRes, vacRes, absRes] = await Promise.all([
        getCalendarEvents(),
        getWorkerVacationsForCalendar(),
        getWorkerAbsencesForCalendar()
      ]);
      let freshEvents: any[] = [];
      if (calRes.success && calRes.events) freshEvents = [...freshEvents, ...calRes.events];
      if (vacRes.success && vacRes.vacations) freshEvents = [...freshEvents, ...vacRes.vacations];
      if (absRes.success && absRes.absences) freshEvents = [...freshEvents, ...absRes.absences];
      
      setEvents(freshEvents);
      setShowEventModal(false);
    } else {
      setFormError(res.error || 'Error al guardar el evento en base de datos.');
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
          <h1 className="page-title brand-font">Calendario del Centro</h1>
          <p className="page-subtitle">Gestión de festivos, puentes, vacaciones y horarios extraordinarios</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => setShowGoogleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
              e.currentTarget.style.borderColor = '#4A4A4A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <CalendarPlus size={18} /> Exportar a Google
          </button>
          
          <button 
            onClick={openNewEventModal}
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
            <Plus size={18} /> Nuevo evento
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. INTERACTIVE CALENDAR VIEW */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center' }}>
              <CalendarIcon size={20} style={{ marginRight: '0.6rem' }} />
              Vista Mensual
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.35rem', padding: '0.35rem 0.75rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.borderColor = 'var(--text-soft)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                Hoy
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1A1A1A', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }} title="Mes anterior">
                  <ChevronLeft size={18} />
                </button>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <select 
                  value={currentMonth} 
                  onChange={handleMonthChange}
                  style={{ padding: '0.35rem', borderRadius: '0.25rem', border: 'none', backgroundColor: 'transparent', color: 'var(--foreground)', cursor: 'pointer', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  {months.map((m, i) => (
                    <option key={i} value={i} style={{ backgroundColor: '#1A1A1A' }}>{m}</option>
                  ))}
                </select>
                <select 
                  value={currentYear} 
                  onChange={handleYearChange}
                  style={{ padding: '0.35rem', borderRadius: '0.25rem', border: 'none', backgroundColor: 'transparent', color: 'var(--foreground)', cursor: 'pointer', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  {years.map(y => (
                    <option key={y} value={y} style={{ backgroundColor: '#1A1A1A' }}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }} title="Mes siguiente">
                <ChevronRight size={18} />
              </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '0.5rem' }}>
                {day}
              </div>
            ))}
            
            {/* Blank tiles for offset */}
            {Array.from({ length: startingEmptyCells }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '60px', backgroundColor: '#1A1A1A', borderRadius: '0.35rem', opacity: 0.3 }}></div>
            ))}
            
            {/* Day tiles */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Find events that overlap this day
              const dayEvents = events.filter(e => {
                if (e.status !== 'ACTIVE') return false;
                
                if (e.recurrence === 'YEARLY') {
                  // For YEARLY, we project the event to the currently viewed year
                  const eventStart = new Date(e.startDate);
                  const eventEnd = new Date(e.endDate);
                  
                  // Create projected dates for the current year being viewed
                  const projectedStart = new Date(currentYear, eventStart.getMonth(), eventStart.getDate());
                  // Handle multi-day events by adding the difference in days
                  const durationMs = eventEnd.getTime() - eventStart.getTime();
                  const projectedEnd = new Date(projectedStart.getTime() + durationMs);
                  
                  const currentRenderDate = new Date(currentYear, currentMonth, day);
                  
                  // Compare just the dates
                  projectedStart.setHours(0,0,0,0);
                  projectedEnd.setHours(23,59,59,999);
                  
                  return currentRenderDate >= projectedStart && currentRenderDate <= projectedEnd;
                }
                
                // For NONE, exact string comparison works since we format as YYYY-MM-DD
                return dateString >= e.startDate && dateString <= e.endDate;
              });
              
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              return (
                <div key={day} className="calendar-day-cell" style={{ 
                  backgroundColor: isToday ? 'rgba(212, 175, 55, 0.05)' : '#1A1A1A', 
                  border: isToday ? '1px solid var(--primary)' : '1px solid #2A2A2A', 
                  borderRadius: '0.35rem', 
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <span style={{ fontSize: '0.85rem', color: isToday ? 'var(--primary)' : 'var(--text-soft)', fontWeight: isToday || dayEvents.length > 0 ? 600 : 400, marginBottom: 'auto' }}>{day}</span>
                  
                  <div className="calendar-events-container">
                    {dayEvents.map(evt => (
                      <React.Fragment key={evt.id}>
                        {/* Desktop Render: Full text pill */}
                        <div className="calendar-event-text" style={{ 
                          backgroundColor: `${getTypeColor(evt)}15`, 
                          color: getTypeColor(evt), 
                          fontSize: '0.65rem', 
                          padding: '0.15rem 0.35rem', 
                          borderRadius: '0.2rem',
                          width: '100%',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {evt.title}
                        </div>
                        
                        {/* Mobile Render: Small color dot */}
                        <div className="calendar-event-dot" style={{
                           width: '6px',
                           height: '6px',
                           borderRadius: '50%',
                           backgroundColor: getTypeColor(evt),
                           flexShrink: 0
                        }}></div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Festivos</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f97316' }}></span> Puentes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span> Vacaciones</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#6b7280' }}></span> Cierre extra</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }}></span> Apertura extra</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a855f7' }}></span> Evento interno</span>
          </div>

          {events.some(e => e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA') && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #2A2A2A', paddingTop: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Equipo:</span>
              {Array.from(new Set(events.filter(e => e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA').map(e => e.workerId))).map((workerId: string) => {
                const workerEvents = events.filter(e => (e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA') && e.workerId === workerId);
                const workerEvent = workerEvents[0];
                const color = getWorkerColor(workerId);
                const titleParts = workerEvent?.title.split(': ');
                const title = titleParts ? titleParts[1] : '';
                return (
                  <span key={workerId} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-soft)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }}></span> {title}
                  </span>
                )
              })}
            </div>
          )}
        </section>

        {/* 2. EVENT LIST */}
        <section className="editorial-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
              Próximos Eventos
            </h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ background: showFilters ? 'var(--primary)' : 'none', border: '1px solid var(--border)', borderRadius: '0.35rem', padding: '0.35rem 0.75rem', color: showFilters ? '#000' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: showFilters ? 600 : 400, transition: 'all 0.2s' }}
            >
              <Filter size={14} /> Filtrar
            </button>
          </div>

          {showFilters && (
            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2A2A2A', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Filtros avanzados</span>
                <button 
                  onClick={clearFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <X size={12} /> Limpiar filtros
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Fechas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desde fecha</label>
                  <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.25rem', color: 'var(--foreground)', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hasta fecha</label>
                  <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.25rem', color: 'var(--foreground)', fontSize: '0.8rem' }} />
                </div>

                {/* Origen */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Origen</label>
                  <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.25rem', color: 'var(--foreground)', fontSize: '0.8rem' }}>
                    <option value="Todos">Todos</option>
                    <option value="Centro">Centro</option>
                    <option value="Equipo">Equipo (Trabajadoras)</option>
                  </select>
                </div>

                {/* Estado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.25rem', color: 'var(--foreground)', fontSize: '0.8rem' }}>
                    <option value="Todos">Todos</option>
                    <option value="Activo">Activo (Aprobado)</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelado">Cancelado / Inactivo</option>
                  </select>
                </div>
                
                {/* Tipo de evento */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo de evento</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['FESTIVO_CERRADO', 'PUENTE_CERRADO', 'VACACIONES_CENTRO', 'CIERRE_EXTRAORDINARIO', 'APERTURA_EXTRAORDINARIA', 'EVENTO_INTERNO', 'VACACIONES_TRABAJADORA', 'AUSENCIA_TRABAJADORA'].map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#111', padding: '0.35rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #333', cursor: 'pointer', fontSize: '0.75rem', opacity: filterTypes.includes(type) || filterTypes.length === 0 ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                        <input 
                          type="checkbox" 
                          checked={filterTypes.includes(type)} 
                          onChange={(e) => {
                            if (e.target.checked) setFilterTypes([...filterTypes, type]);
                            else setFilterTypes(filterTypes.filter(t => t !== type));
                          }} 
                          style={{ accentColor: 'var(--primary)', width: '12px', height: '12px' }} 
                        />
                        <span style={{ color: filterTypes.includes(type) ? 'var(--foreground)' : 'var(--text-muted)' }}>{getTypeLabel(type)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trabajadoras */}
                {(filterOrigin === 'Todos' || filterOrigin === 'Equipo') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trabajadora (Aplica solo a Vacaciones y Ausencias del Equipo)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {getUniqueWorkersList().length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.35rem 0' }}>No hay registros de equipo asignados.</span>
                      ) : getUniqueWorkersList().map(w => (
                        <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#111', padding: '0.35rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #333', cursor: 'pointer', fontSize: '0.75rem', opacity: filterWorkers.includes(w.id) || filterWorkers.length === 0 ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                          <input 
                            type="checkbox" 
                            checked={filterWorkers.includes(w.id)} 
                            onChange={(e) => {
                              if (e.target.checked) setFilterWorkers([...filterWorkers, w.id]);
                              else setFilterWorkers(filterWorkers.filter(id => id !== w.id));
                            }} 
                            style={{ accentColor: 'var(--primary)', width: '12px', height: '12px' }} 
                          />
                          <span style={{ color: filterWorkers.includes(w.id) ? 'var(--foreground)' : 'var(--text-muted)' }}>{w.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Vigencia</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Tipo</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Descripción</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Recurrencia</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Estado</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* 
                  To show events in the upcoming list properly, we'll map them 
                  based on the currently viewed Year and Month. 
                  This dynamically populates the list instead of showing a raw DB dump.
                */}
                {(() => {
                  let activeEvents = events.filter(e => {
                    // Origin Filter
                    const isWorker = e.type === 'VACACIONES_TRABAJADORA' || e.type === 'AUSENCIA_TRABAJADORA';
                    if (filterOrigin === 'Centro' && isWorker) return false;
                    if (filterOrigin === 'Equipo' && !isWorker) return false;

                    // Type Filter
                    if (filterTypes.length > 0 && !filterTypes.includes(e.type)) return false;

                    // Worker Filter
                    if (isWorker && filterWorkers.length > 0 && !filterWorkers.includes(e.workerId)) return false;

                    // Date Filters
                    if (filterStartDate && e.endDate < filterStartDate) return false;
                    if (filterEndDate && e.startDate > filterEndDate) return false;

                    // Status Filter
                    if (filterStatus !== 'Todos') {
                      if (filterStatus === 'Activo') {
                        const esActivoTrab = isWorker && (e.originalStatus === 'Aprobada' || e.status === 'ACTIVE');
                        const esActivoCentro = !isWorker && e.status === 'ACTIVE';
                        if (!esActivoTrab && !esActivoCentro) return false;
                      } else if (filterStatus === 'Pendiente') {
                        if (!isWorker || e.originalStatus !== 'Pendiente') return false;
                      } else if (filterStatus === 'Cancelado') {
                        const esCanceladoTrab = isWorker && (e.originalStatus === 'Cancelada' || e.status === 'INACTIVE');
                        const esCanceladoCentro = !isWorker && e.status === 'INACTIVE';
                        if (!esCanceladoTrab && !esCanceladoCentro) return false;
                      }
                    }

                    return true;
                  });

                  const projectedEvents = activeEvents
                    .map(e => {
                      if (e.recurrence === 'YEARLY') {
                        const evtStart = new Date(e.startDate);
                        const evtEnd = new Date(e.endDate);
                        const durationMs = evtEnd.getTime() - evtStart.getTime();

                        // Project to current viewing year
                        const pStart = new Date(currentYear, evtStart.getMonth(), evtStart.getDate());
                        const pEnd = new Date(pStart.getTime() + durationMs);
                        
                        // We format the projected strings to sort them consistently
                        const fmtStart = `${currentYear}-${String(pStart.getMonth() + 1).padStart(2, '0')}-${String(pStart.getDate()).padStart(2, '0')}`;
                        
                        return { ...e, projectedSortDate: fmtStart, isProjected: true };
                      }
                      
                      return { ...e, projectedSortDate: e.startDate, isProjected: false };
                    })
                    // Filter to only show events relevant to the current month or future 
                    // (for simplicity here, let's just sort them all by the projected date)
                    .sort((a, b) => a.projectedSortDate.localeCompare(b.projectedSortDate));
                  
                  if (projectedEvents.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No hay eventos configurados.
                        </td>
                      </tr>
                    );
                  }

                  return projectedEvents.map((event) => (
                    <tr key={event.id} style={{ borderBottom: '1px solid #2A2A2A', transition: 'background var(--transition)', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>
                      {event.recurrence === 'YEARLY' ? (
                         // If annual, show with Day/Month specifically
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="calendar-date-desktop">
                              {new Date(event.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                              {event.startDate !== event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
                            </span>
                            <span className="calendar-date-mobile">
                              {new Date(event.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                              {event.startDate !== event.endDate && `-${new Date(event.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`}
                            </span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#333', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', whiteSpace: 'nowrap' }}>Anual</span>
                         </span>
                      ) : (
                        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span className="calendar-date-desktop">
                            {event.startDate === event.endDate 
                              ? event.startDate 
                              : `${event.startDate} - ${event.endDate}`}
                          </span>
                          <span className="calendar-date-mobile">
                            {event.startDate === event.endDate 
                              ? new Date(event.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                              : `${new Date(event.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })} - ${new Date(event.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
                          </span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ 
                        backgroundColor: `${getTypeColor(event)}15`, // adds 15 hex for opacity 
                        color: getTypeColor(event),
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {getTypeLabel(event.type)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                      {event.title}
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
                      {event.recurrence === 'YEARLY' ? 'Anual' : 'Sin recurrencia'}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ color: event.status === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {event.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', position: 'relative' }}>
                      {event.type !== 'VACACIONES_TRABAJADORA' && event.type !== 'AUSENCIA_TRABAJADORA' ? (
                        <>
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === event.id ? null : event.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openDropdownId === event.id && (
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
                                zIndex: 10,
                                minWidth: '150px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                              }}
                            >
                              <button 
                                onClick={() => openEditEventModal(event)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                  padding: '0.65rem 0.75rem', 
                                  backgroundColor: 'transparent', 
                                  border: 'none', 
                                  color: 'var(--text-soft)', 
                                  cursor: 'pointer',
                                  borderRadius: '0.25rem',
                                  textAlign: 'left',
                                  fontSize: '0.85rem',
                                  transition: 'background var(--transition)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-soft)'; }}
                              >
                                <Edit2 size={16} /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                  padding: '0.65rem 0.75rem', 
                                  backgroundColor: 'transparent', 
                                  border: 'none', 
                                  color: '#ef4444', 
                                  cursor: 'pointer',
                                  borderRadius: '0.25rem',
                                  textAlign: 'left',
                                  fontSize: '0.85rem',
                                  transition: 'background var(--transition)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={16} /> Eliminar
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo lectura</span>
                      )}
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* MODAL: GOOGLE CALENDAR EXPORT PREPARATION */}
      {showGoogleModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          zIndex: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="editorial-panel" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            padding: '2.5rem', 
            position: 'relative' 
          }}>
            <button 
              onClick={() => setShowGoogleModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarPlus size={30} color="var(--primary)" />
              </div>
            </div>
            
            <h3 className="brand-font" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--foreground)' }}>
              Integración con Google Calendar
            </h3>
            
            <p style={{ color: 'var(--text-soft)', lineHeight: '1.6', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Próximamente podrás vincular este calendario corporativo con tu cuenta de Google. Esto permitirá exportar automáticamente los <strong>festivos, cierres y vacaciones</strong> del centro directamente a tu agenda personal o de equipo.
            </p>
            
            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem', padding: '1rem', marginBottom: '2rem' }}>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Sincronización bidireccional de eventos y cierres.</li>
                <li>Gestión de vacaciones de trabajadoras en tiempo real.</li>
                <li>Alertas cruzadas de solapamiento de jornadas.</li>
              </ul>
            </div>
            
            <button 
              onClick={() => setShowGoogleModal(false)}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: '#000',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EVENTO (FORMULARIO ESTRUCTURAL) */}
      {showEventModal && (
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
            maxWidth: '600px', 
            padding: '2rem', 
            position: 'relative' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingId ? "Editar Evento" : "Nuevo Evento"}
              </h3>
              <button 
                onClick={() => setShowEventModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.35rem', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo de evento</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                  >
                    <option value="FESTIVO_CERRADO">Festivo cerrado</option>
                    <option value="PUENTE_CERRADO">Puente cerrado</option>
                    <option value="VACACIONES_CENTRO">Vacaciones del centro</option>
                    <option value="CIERRE_EXTRAORDINARIO">Cierre extraordinario</option>
                    <option value="APERTURA_EXTRAORDINARIA">Apertura extraordinaria</option>
                    <option value="EVENTO_INTERNO">Evento interno</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Descripción / Título</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Festivo local, Curso de reciclaje..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de inicio</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--text-soft)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de fin (opcional)</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--text-soft)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recurrencia</label>
                  <select 
                    value={formData.recurrence}
                    onChange={(e) => setFormData({...formData, recurrence: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                  >
                    <option value="NONE">Sin recurrencia</option>
                    <option value="YEARLY">Recurrente anual</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingId ? "Guardar cambios" : "Guardar evento"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
