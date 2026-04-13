"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Calendar, Settings, Clock, DollarSign, Activity, FileText, Briefcase, CalendarPlus, Edit2, Trash2, X, Users, MoreVertical, Pencil, Search } from "lucide-react";
import { getWorkerById, updateWorker, createWorkerVacation, updateWorkerVacation, deleteWorkerVacation, updateWorkerVacationDays, createWorkerAbsence, updateWorkerAbsence, deleteWorkerAbsence, getWorkerSales } from "@/actions/workers";
import { getCalendarEvents } from "@/actions/calendar";
import { getServices } from "@/actions/services";

export default function WorkerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [worker, setWorker] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  
  // Edit form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    mobile: '',
    email: '',
    onboardDate: '',
    contractType: 'Indefinido',
    status: 'Activa'
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  // Vacations state
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState<string | null>(null);
  const [vacationFormData, setVacationFormData] = useState({
    startDate: '',
    endDate: '',
    status: 'Aprobada',
    notes: ''
  });
  const [vacationFormError, setVacationFormError] = useState('');
  const [openVacationDropdownId, setOpenVacationDropdownId] = useState<string | null>(null);

  // Absences state
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
  const [absenceFormData, setAbsenceFormData] = useState({
    type: 'Baja laboral',
    startDate: '',
    endDate: '',
    status: 'Activa',
    notes: ''
  });
  const [absenceFormError, setAbsenceFormError] = useState('');
  const [openAbsenceDropdownId, setOpenAbsenceDropdownId] = useState<string | null>(null);

  // Edit Assigned Days State
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [daysFormData, setDaysFormData] = useState({ vacationDays: 22 });
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Costs State
  const [costsFormData, setCostsFormData] = useState({ 
    monthlyCost: 0, 
    weeklyHours: 40,
    targetMinimum: 0,
    targetHealthy: 0 
  });
  const [costsSelectedMonth, setCostsSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [costsSelectedYear, setCostsSelectedYear] = useState(() => new Date().getFullYear());
  const [costsFormStatus, setCostsFormStatus] = useState({ type: '', message: '' });

  // Profitability State
  const [profSelectedMonth, setProfSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [profSelectedYear, setProfSelectedYear] = useState(() => new Date().getFullYear());
  const [profSalesData, setProfSalesData] = useState<any[]>([]);
  const [profLoading, setProfLoading] = useState(false);

  // Operativa State
  const [operativaSearch, setOperativaSearch] = useState('');

  // Generar categorías reales a partir de los datos en base al email de la trabajadora
  const operativeCategories = React.useMemo(() => {
    if (!worker?.email || !servicesData.length) return [];
    
    const workerEmail = worker.email.trim().toLowerCase();
    
    // Filtrar los servicios donde esté autorizado este email
    const authorizedServices = servicesData.filter(svc => {
      if (!svc.employees) return false;
      
      // Separar por múltiples caracteres típicamente usados (comas, punto y coma, saltos)
      const emails = svc.employees.split(/[,;\n]+/).map((e: string) => e.trim().toLowerCase());
      
      return emails.includes(workerEmail);
    });

    // Agrupar por categoría
    const grouped = authorizedServices.reduce((acc: any, curr: any) => {
      const catName = curr.category?.trim() || 'Sin Categoría';
      if (!acc[catName]) {
        acc[catName] = [];
      }
      acc[catName].push(curr.name);
      return acc;
    }, {});

    // Convertir a array formato { id, name, services }
    return Object.keys(grouped).map((catName, index) => ({
      id: `cat-${index}`,
      name: catName,
      services: grouped[catName].sort((a: string, b: string) => a.localeCompare(b))
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [servicesData, worker?.email]);

  const totalServices = operativeCategories.reduce((acc, cat) => acc + cat.services.length, 0);
  const totalCategories = operativeCategories.length;

  const filteredCategories = operativeCategories.map(cat => ({
    ...cat,
    services: cat.services.filter((s: string) => s.toLowerCase().includes(operativaSearch.toLowerCase()))
  })).filter(cat => cat.services.length > 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenVacationDropdownId(null);
        setOpenAbsenceDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      const [resWorker, resCalendar, resServices] = await Promise.all([
        getWorkerById(id as string),
        getCalendarEvents(),
        getServices()
      ]);

      if (resCalendar.success) {
        setCalendarEvents(resCalendar.events || []);
      }

      if (resServices.success) {
        setServicesData(resServices.data || []);
      }

      if (resWorker.success && resWorker.worker) {
        setWorker(resWorker.worker);
        setFormData({
          firstName: resWorker.worker.firstName,
          lastName: resWorker.worker.lastName,
          birthDate: resWorker.worker.birthDate || '',
          mobile: resWorker.worker.phone || '',
          email: resWorker.worker.email || '',
          onboardDate: resWorker.worker.hireDate || '',
          contractType: resWorker.worker.contractType,
          status: resWorker.worker.status
        });
        setDaysFormData({ vacationDays: resWorker.worker.vacationDays ?? 22 });
        setCostsFormData({
          monthlyCost: resWorker.worker.monthlyCost || 0,
          weeklyHours: resWorker.worker.weeklyHours || 40,
          targetMinimum: resWorker.worker.targetMinimum || 0,
          targetHealthy: resWorker.worker.targetHealthy || 0
        });
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "profitability" && worker?.firstName) {
      setProfLoading(true);
      getWorkerSales(worker.firstName, profSelectedYear, profSelectedMonth).then(res => {
        if (res.success) setProfSalesData(res.sales || []);
        setProfLoading(false);
      });
    }
  }, [activeTab, profSelectedMonth, profSelectedYear, worker?.firstName]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ type: '', message: '' });

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormStatus({ type: 'error', message: 'Nombre y apellidos son obligatorios.' });
      return;
    }

    const res = await updateWorker(id as string, formData);
    
    if (res.success) {
      setFormStatus({ type: 'success', message: 'Ficha actualizada correctamente.' });
      setWorker((prev: any) => ({
        ...prev,
        ...res.worker
      }));
      // Clear success message after 3 seconds
      setTimeout(() => setFormStatus({ type: '', message: '' }), 3000);
    } else {
      setFormStatus({ type: 'error', message: "Error al actualizar la ficha: " + res.error });
    }
  };

  const handleSaveCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    setCostsFormStatus({ type: '', message: '' });
    
    const res = await updateWorker(id as string, {
      firstName: worker.firstName, 
      lastName: worker.lastName,   
      monthlyCost: Number(costsFormData.monthlyCost),
      weeklyHours: Number(costsFormData.weeklyHours),
      targetMinimum: Number(costsFormData.targetMinimum),
      targetHealthy: Number(costsFormData.targetHealthy)
    });

    if (res.success) {
      setCostsFormStatus({ type: 'success', message: 'Costes base actualizados correctamente.' });
      setWorker((prev: any) => ({
        ...prev,
        ...res.worker
      }));
      setTimeout(() => setCostsFormStatus({ type: '', message: '' }), 3000);
    } else {
      setCostsFormStatus({ type: 'error', message: "Error al actualizar costes: " + res.error });
    }
  };

  // --- VACATIONS HELPERS ---
  const calculateDays = (startStr: string | Date, endStr: string | Date) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Si las fechas son inválidas o la fecha final es menor que la inicial
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }

    let count = 0;
    const current = new Date(start);

    // Filter closures
    const closures = calendarEvents.filter((ev: any) => 
      ['FESTIVO_CERRADO', 'PUENTE_CERRADO', 'CIERRE_EXTRAORDINARIO', 'VACACIONES_CENTRO'].includes(ev.type)
    );

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday
      
      // Exclude strings
      const currentDateString = current.toISOString().split('T')[0];
      
      const isClosure = closures.some((closure) => {
        const cStart = new Date(closure.startDate).toISOString().split('T')[0];
        const cEnd = new Date(closure.endDate).toISOString().split('T')[0];
        // If yearly, we ignore the year component strictly to check month and day
        if (closure.recurrence === 'YEARLY') {
            const mCStart = cStart.substring(4);
            const mCur = currentDateString.substring(4);
            return mCur === mCStart;
        } else {
            return currentDateString >= cStart && currentDateString <= cEnd;
        }
      });

      // Contamos si no es domingo (0) y no es cierre de centro
      if (dayOfWeek !== 0 && !isClosure) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const enjoyedDays = worker?.vacations?.reduce((acc: number, vac: any) => {
    // Solo contamos las aprobadas o disfrutadas, no las canceladas
    if (vac.status === 'Cancelada') return acc;
    return acc + calculateDays(vac.startDate, vac.endDate);
  }, 0) || 0;

  const assignedDays = worker?.vacationDays ?? 22;
  const availableDays = assignedDays - enjoyedDays;

  // --- VACATIONS HANDLERS ---
  const handleSaveDays = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await updateWorkerVacationDays(id as string, daysFormData.vacationDays);
    if (res.success) {
      setWorker((prev: any) => ({ ...prev, vacationDays: daysFormData.vacationDays }));
      setShowDaysModal(false);
    } else {
      alert("Error al actualizar días: " + res.error);
    }
  };

  const handleSaveVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    setVacationFormError('');

    if (new Date(vacationFormData.endDate) < new Date(vacationFormData.startDate)) {
      setVacationFormError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    let res;
    if (editingVacationId) {
      res = await updateWorkerVacation(editingVacationId, id as string, vacationFormData);
    } else {
      res = await createWorkerVacation(id as string, vacationFormData);
    }

    if (res.success) {
      // Reload completely to get fresh relations
      const freshRes = await getWorkerById(id as string);
      if (freshRes.success && freshRes.worker) {
        setWorker(freshRes.worker);
      }
      setShowVacationModal(false);
    } else {
      setVacationFormError("Error al guardar vacación: " + res.error);
    }
  };

  const handleDeleteVacation = async (vacationId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este periodo vacacional?")) {
      const res = await deleteWorkerVacation(vacationId, id as string);
      if (res.success) {
        setWorker((prev: any) => ({
          ...prev,
          vacations: prev.vacations.filter((v: any) => v.id !== vacationId)
        }));
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
    setOpenVacationDropdownId(null);
  };
  
  // --- ABSENCES HANDLERS ---
  const calculateNaturalDays = (startStr: string | Date, endStr: string | Date) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSaveAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setAbsenceFormError('');

    if (new Date(absenceFormData.endDate) < new Date(absenceFormData.startDate)) {
      setAbsenceFormError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    let res;
    if (editingAbsenceId) {
      res = await updateWorkerAbsence(editingAbsenceId, id as string, absenceFormData);
    } else {
      res = await createWorkerAbsence(id as string, absenceFormData);
    }

    if (res.success) {
      const freshRes = await getWorkerById(id as string);
      if (freshRes.success && freshRes.worker) {
        setWorker(freshRes.worker);
      }
      setShowAbsenceModal(false);
    } else {
      setAbsenceFormError("Error al guardar ausencia: " + res.error);
    }
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta ausencia?")) {
      const res = await deleteWorkerAbsence(absenceId, id as string);
      if (res.success) {
        setWorker((prev: any) => ({
          ...prev,
          absences: prev.absences.filter((a: any) => a.id !== absenceId)
        }));
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
    setOpenAbsenceDropdownId(null);
  };
  
  const openNewAbsenceModal = () => {
    setEditingAbsenceId(null);
    setAbsenceFormData({
      type: 'Baja laboral',
      startDate: '',
      endDate: '',
      status: 'Activa',
      notes: ''
    });
    setAbsenceFormError('');
    setShowAbsenceModal(true);
  };

  const openEditAbsenceModal = (absence: any) => {
    setEditingAbsenceId(absence.id);
    setAbsenceFormData({
      type: absence.type,
      startDate: new Date(absence.startDate).toISOString().substring(0, 10),
      endDate: new Date(absence.endDate).toISOString().substring(0, 10),
      status: absence.status,
      notes: absence.notes || ''
    });
    setAbsenceFormError('');
    setShowAbsenceModal(true);
    setOpenAbsenceDropdownId(null);
  };
  
  const openNewVacationModal = () => {
    setEditingVacationId(null);
    setVacationFormData({
      startDate: '',
      endDate: '',
      status: 'Aprobada',
      notes: ''
    });
    setVacationFormError('');
    setShowVacationModal(true);
  };

  const openEditVacationModal = (vacation: any) => {
    setEditingVacationId(vacation.id);
    setVacationFormData({
      startDate: new Date(vacation.startDate).toISOString().substring(0, 10),
      endDate: new Date(vacation.endDate).toISOString().substring(0, 10),
      status: vacation.status,
      notes: vacation.notes || ''
    });
    setVacationFormError('');
    setShowVacationModal(true);
    setOpenVacationDropdownId(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Cargando ficha de trabajadora...
      </div>
    );
  }

  if (!worker) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem', color: 'var(--text-muted)' }}>
        <p>Trabajadora no encontrada.</p>
        <Link href="/settings/workers" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          Volver al listado
        </Link>
      </div>
    );
  }

  const TABS = [
    { id: 'general', label: 'General', icon: Briefcase, disabled: false },
    { id: 'operativa', label: 'Operativa', icon: Users, disabled: false },
    { id: 'vacations', label: 'Vacaciones', icon: Calendar, disabled: false },
    { id: 'absences', label: 'Ausencias', icon: CalendarPlus, disabled: false },
    { id: 'costs', label: 'Costes', icon: FileText, disabled: false },
    { id: 'profitability', label: 'Rentabilidad', icon: Activity, disabled: false },
  ];

  return (
    <div className="space-y-8">
      {/* PROFILE HEADER */}
      <header className="editorial-panel" style={{ padding: '2rem' }}>
        <Link 
          href="/settings/workers" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--text-muted)', 
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textDecoration: 'none',
            transition: 'color var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={16} /> Volver a trabajadoras
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Avatar Placeholder */}
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              backgroundColor: 'rgba(212, 175, 55, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--primary)',
              flexShrink: 0
            }}>
              <span className="brand-font" style={{ fontSize: '2rem', color: 'var(--primary)' }}>
                {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
              </span>
            </div>
            
            <div>
              <h1 className="brand-font" style={{ fontSize: '2rem', margin: 0, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                {worker.firstName} {worker.lastName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                <span>{worker.contractType}</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span style={{ 
                  color: worker.status === 'Activa' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '0.35rem'
                }}>
                  <span style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    backgroundColor: worker.status === 'Activa' ? 'var(--primary)' : 'var(--text-muted)' 
                  }}></span>
                  {worker.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : (tab.disabled ? 'var(--text-muted)' : 'var(--text-soft)'),
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              opacity: tab.disabled ? 0.5 : 1,
              transition: 'all var(--transition)',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.disabled && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#333', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', marginLeft: '0.5rem' }}>
                Próximamente
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT (GENERAL) */}
      {activeTab === "general" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* LEFT COLUMN: EDIT FORM */}
          <div className="editorial-panel" style={{ padding: '2rem', gridColumn: 'span 2' }}>
            <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              Datos Personales y Laborales
            </h3>
            
            <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {formStatus.message && (
                <div style={{ 
                  backgroundColor: formStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                  border: `1px solid ${formStatus.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, 
                  color: formStatus.type === 'error' ? '#ef4444' : '#10b981', 
                  padding: '0.75rem', 
                  borderRadius: '0.35rem', 
                  fontSize: '0.85rem' 
                }}>
                  {formStatus.message}
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
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email</label>
                    <input 
                      type="email" 
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
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de alta</label>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Guardar cambios
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: OPERATIVE & SUMMARY PLACEHOLDERS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* RESUMEN (Summary Cards) */}
            <div className="editorial-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '1.5rem' }}>Resumen Anual</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#1A1A1A', borderRadius: '0.5rem', border: '1px solid #2A2A2A', opacity: 0.7 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Días disponibles</span>
                  <span style={{ color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>{availableDays} / {assignedDays}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#1A1A1A', borderRadius: '0.5rem', border: '1px solid #2A2A2A', opacity: 0.7 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Última ausencia</span>
                  <span style={{ color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>Sin registrar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#1A1A1A', borderRadius: '0.5rem', border: '1px solid #2A2A2A', opacity: 0.7 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Operativa</span>
                  <span style={{ color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>Pendiente</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT (OPERATIVA) */}
      {activeTab === "operativa" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* HEADER & TOP SUMMARY */}
          <div className="editorial-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, marginBottom: '0.25rem' }}>Operativa</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', margin: 0 }}>
                  Servicios habilitados para esta trabajadora
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ backgroundColor: '#1A1A1A', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1 }}>{totalServices}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Servicios</span>
                </div>
                <div style={{ backgroundColor: '#1A1A1A', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1 }}>{totalCategories}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Categorías</span>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar servicio..." 
                value={operativaSearch}
                onChange={(e) => setOperativaSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  backgroundColor: '#111', border: '1px solid #333', 
                  borderRadius: '0.35rem', color: 'var(--foreground)', fontSize: '0.85rem' 
                }} 
              />
            </div>
          </div>

          {/* LIST & CATEGORIES */}
          <div className="editorial-panel" style={{ padding: '2rem' }}>
            {totalServices === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', margin: 0, marginBottom: '0.5rem' }}>
                  Esta trabajadora no tiene servicios asignados todavía.
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  La operativa se configura desde Ajustes → Servicios.
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', margin: 0 }}>
                  No se han encontrado servicios que coincidan con la búsqueda.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {filteredCategories.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cat.name}
                      </h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {cat.services.map((service: string, idx: number) => (
                        <div key={idx} style={{ 
                          padding: '0.6rem 1rem', 
                          backgroundColor: '#1A1A1A', 
                          border: '1px solid #2A2A2A', 
                          borderRadius: '0.35rem',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          transition: 'border-color 0.2s, background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.backgroundColor = '#1E1E1E';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2A2A2A';
                          e.currentTarget.style.backgroundColor = '#1A1A1A';
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', opacity: 0.5 }} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* READ ONLY DISCLAIMER */}
            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #333', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Settings size={14} opacity={0.5} />
              <span style={{ fontSize: '0.75rem' }}>
                La asignación de servicios se gestiona desde Ajustes → Servicios
              </span>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT (VACACIONES) */}
      {activeTab === "vacations" && (
        <div className="space-y-6">
          {/* BOLSA DE VACACIONES */}
          <section className="editorial-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                Bolsa de Vacaciones
              </h3>
              <button 
                onClick={() => {
                  setDaysFormData({ vacationDays: worker?.vacationDays ?? 22 });
                  setShowDaysModal(true);
                }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.35rem', padding: '0.35rem 0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8rem' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <Settings size={14} /> Ajustar bolsa
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: '#1A1A1A', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Días asignados</span>
                <span className="brand-font" style={{ fontSize: '2rem', color: 'var(--foreground)' }}>{assignedDays}</span>
              </div>
              <div style={{ backgroundColor: '#1A1A1A', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Días disfrutados</span>
                <span className="brand-font" style={{ fontSize: '2rem', color: 'var(--text-soft)' }}>{enjoyedDays}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--primary)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Días disponibles</span>
                <span className="brand-font" style={{ fontSize: '2.5rem', color: 'var(--primary)', lineHeight: 1 }}>{availableDays}</span>
              </div>
            </div>
          </section>

          {/* LISTADO DE VACACIONES */}
          <section className="editorial-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                Periodos vacacionales
              </h3>
              <button 
                onClick={openNewVacationModal}
                style={{ background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '0.35rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Nueva vacación
              </button>
            </div>

            <div style={{ overflow: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Inicio</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Fin</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Días</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Estado</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Observaciones</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!worker?.vacations || worker.vacations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay periodos vacacionales registrados.
                      </td>
                    </tr>
                  ) : (
                    worker.vacations.map((vac: any) => (
                      <tr key={vac.id} style={{ borderBottom: '1px solid #2A2A2A', transition: 'background var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                          {new Date(vac.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                          {new Date(vac.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>
                          {calculateDays(vac.startDate, vac.endDate)}
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{ 
                            backgroundColor: vac.status === 'Aprobada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: vac.status === 'Aprobada' ? '#10b981' : '#ef4444',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {vac.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {vac.notes || '-'}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', position: 'relative' }}>
                          <button 
                            onClick={() => setOpenVacationDropdownId(openVacationDropdownId === vac.id ? null : vac.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openVacationDropdownId === vac.id && (
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
                              <button
                                onClick={() => openEditVacationModal(vac)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  width: '100%', padding: '0.65rem 0.75rem',
                                  backgroundColor: 'transparent', border: 'none', color: 'var(--text-soft)',
                                  textAlign: 'left', cursor: 'pointer', borderRadius: '0.25rem',
                                  fontSize: '0.85rem', transition: 'background var(--transition)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-soft)'; }}
                              >
                                <Pencil size={15} /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteVacation(vac.id)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT (AUSENCIAS) */}
      {activeTab === "absences" && (
        <div className="space-y-6">
          <section className="editorial-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                Registro de Ausencias
              </h3>
              <button 
                onClick={openNewAbsenceModal}
                style={{ background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '0.35rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Nueva ausencia
              </button>
            </div>

            <div style={{ overflow: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Tipo</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Inicio</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Fin</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Días</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Estado</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Observaciones</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!worker?.absences || worker.absences.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay ausencias registradas.
                      </td>
                    </tr>
                  ) : (
                    worker.absences.map((abs: any) => (
                      <tr key={abs.id} style={{ borderBottom: '1px solid #2A2A2A', transition: 'background var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                          {abs.type}
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                          {new Date(abs.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--foreground)' }}>
                          {new Date(abs.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>
                          {calculateNaturalDays(abs.startDate, abs.endDate)}
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{ 
                            backgroundColor: abs.status === 'Activa' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: abs.status === 'Activa' ? 'var(--primary)' : '#10b981',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {abs.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {abs.notes || '-'}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', position: 'relative' }}>
                          <button 
                            onClick={() => setOpenAbsenceDropdownId(openAbsenceDropdownId === abs.id ? null : abs.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openAbsenceDropdownId === abs.id && (
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
                              <button
                                onClick={() => openEditAbsenceModal(abs)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  width: '100%', padding: '0.65rem 0.75rem',
                                  backgroundColor: 'transparent', border: 'none', color: 'var(--text-soft)',
                                  textAlign: 'left', cursor: 'pointer', borderRadius: '0.25rem',
                                  fontSize: '0.85rem', transition: 'background var(--transition)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-soft)'; }}
                              >
                                <Pencil size={15} /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteAbsence(abs.id)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT (COSTES) */}
      {activeTab === "costs" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#111', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: 'auto' }}>Mes de cálculo</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={costsSelectedMonth}
                onChange={(e) => setCostsSelectedMonth(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + 
                     new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }).slice(1)}
                  </option>
                ))}
              </select>
              <select 
                value={costsSelectedYear}
                onChange={(e) => setCostsSelectedYear(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* BLOQUE 1: EDITABLE */}
            <div className="editorial-panel" style={{ padding: '2rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                Datos Base (Persistentes)
              </h3>
              
              <form onSubmit={handleSaveCosts} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {costsFormStatus.message && (
                  <div style={{ 
                    backgroundColor: costsFormStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    border: `1px solid ${costsFormStatus.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, 
                    color: costsFormStatus.type === 'error' ? '#ef4444' : '#10b981', 
                    padding: '0.75rem', 
                    borderRadius: '0.35rem', 
                    fontSize: '0.85rem' 
                  }}>
                    {costsFormStatus.message}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Coste Mensual Empresa (€)</label>
                  <input 
                    type="number" 
                    step="1"
                    min="0"
                    value={costsFormData.monthlyCost === 0 ? '' : costsFormData.monthlyCost}
                    onChange={(e) => setCostsFormData({...costsFormData, monthlyCost: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.5rem', marginBottom: 0 }}>Costo total incluyendo seguros sociales y prorrata de pagas.</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Horas Semanales (Contrato)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={costsFormData.weeklyHours === 0 ? '' : costsFormData.weeklyHours}
                    onChange={(e) => setCostsFormData({...costsFormData, weeklyHours: parseFloat(e.target.value) || 0})}
                    placeholder="40.0"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Objetivo Mínimo (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={costsFormData.targetMinimum === 0 ? '' : costsFormData.targetMinimum}
                    onChange={(e) => setCostsFormData({...costsFormData, targetMinimum: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.5rem', marginBottom: 0 }}>Facturación mínima para cubrir costes de estructura (umbral).</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Objetivo Saludable (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={costsFormData.targetHealthy === 0 ? '' : costsFormData.targetHealthy}
                    onChange={(e) => setCostsFormData({...costsFormData, targetHealthy: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '0.5rem', marginBottom: 0 }}>Facturación esperada para generar rentabilidad.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gridColumn: '1 / -1' }}>
                  <button 
                    type="submit"
                    style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Guardar costes
                  </button>
                </div>
              </form>
            </div>

            {/* BLOQUE 2: CALCULADO */}
            <div className="editorial-panel" style={{ padding: '2rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--accent-foreground)', margin: 0, marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                Cálculo Dinámico
              </h3>
              
              {(() => {
                const daysInMonth = new Date(costsSelectedYear, costsSelectedMonth, 0).getDate();
                let workingDaysInMonth = 0;
                
                for (let i = 1; i <= daysInMonth; i++) {
                  const date = new Date(costsSelectedYear, costsSelectedMonth - 1, i);
                  if (date.getDay() !== 0) { // Excluir solo los domingos
                    workingDaysInMonth++;
                  }
                }

                // mensualidades: (horasSemanales / 5) * días laborables del mes
                const monthlyHours = (costsFormData.weeklyHours / 5) * workingDaysInMonth;
                const hourlyCost = monthlyHours > 0 ? (costsFormData.monthlyCost / monthlyHours) : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed #333' }}>
                      <span style={{ color: 'var(--text-soft)' }}>Días laborables del mes</span>
                      <span className="brand-font" style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>{workingDaysInMonth} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>días</span></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed #333' }}>
                      <span style={{ color: 'var(--text-soft)' }}>Horas mensuales imputadas</span>
                      <span className="brand-font" style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>{monthlyHours.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>h</span></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Coste por hora real</span>
                      <span className="brand-font" style={{ fontSize: '2.5rem', color: 'var(--primary)', lineHeight: 1 }}>{hourlyCost.toFixed(2)} <span style={{ fontSize: '1.25rem' }}>€</span></span>
                    </div>

                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <FileText size={18} color="rgba(59, 130, 246, 0.8)" style={{ flexShrink: 0, marginTop: '2px' }}/>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                        Modifica el mes selector superior para ver variaciones de calendario. Fórmula base: <code>(horasSemanales / 5) * (díasMes - domingos)</code>. Estos cálculos son proyecciones sin afección en BD.
                      </p>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT (RENTABILIDAD) */}
      {activeTab === "profitability" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#111', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: 'auto' }}>Periodo de análisis</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={profSelectedMonth}
                onChange={(e) => setProfSelectedMonth(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + 
                     new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }).slice(1)}
                  </option>
                ))}
              </select>
              <select 
                value={profSelectedYear}
                onChange={(e) => setProfSelectedYear(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>

          {profLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ventas...</div>
          ) : profSalesData.length === 0 ? (
            <div className="empty-state" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#111', borderRadius: '0.5rem', border: '1px dashed #333' }}>
              <Activity size={48} color="var(--border)" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--foreground)', margin: '0 0 0.5rem' }}>Sin ventas registradas</h3>
              <p style={{ color: 'var(--text-soft)', margin: 0 }}>No hay facturación importada a nombre de <strong>{worker?.firstName}</strong> para el mes de {new Date(2000, profSelectedMonth - 1, 1).toLocaleString('es-ES', { month: 'long' })} {profSelectedYear}.</p>
            </div>
          ) : (() => {
            // --- CORE CALCULATIONS ---
            const totalRevenue = profSalesData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

            // Time math
            const daysInMonth = new Date(profSelectedYear, profSelectedMonth, 0).getDate();
            let workingDaysInMonth = 0;
            for (let i = 1; i <= daysInMonth; i++) {
              if (new Date(profSelectedYear, profSelectedMonth - 1, i).getDay() !== 0) workingDaysInMonth++;
            }
            const monthlyHours = (costsFormData.weeklyHours / 5) * workingDaysInMonth;
            const hourlyCost = monthlyHours > 0 ? (costsFormData.monthlyCost / monthlyHours) : 0;
            const periodCost = costsFormData.monthlyCost;
            const grossResult = totalRevenue - periodCost;

            // Objectives
            const targetMin = costsFormData.targetMinimum || 0;
            const targetHealth = costsFormData.targetHealthy || 0;
            const diffVsMinimum = totalRevenue - targetMin;
            const diffVsHealthy = totalRevenue - targetHealth;
            const complianceMinimum = targetMin > 0 ? (totalRevenue / targetMin) * 100 : 0;
            const complianceHealthy = targetHealth > 0 ? (totalRevenue / targetHealth) * 100 : 0;

            // Service Time mappings
            let totalServiceMinutes = 0;
            profSalesData.forEach(sale => {
              if (sale.reference) {
                // Try crossing with Services memory base exclusively by reference
                const svc = servicesData.find(s => s.reference === sale.reference);
                if (svc && svc.duration) {
                  totalServiceMinutes += (svc.duration * (sale.quantity || 1));
                }
              }
            });
            const effectiveHours = totalServiceMinutes / 60;
            const occupancy = monthlyHours > 0 ? (effectiveHours / monthlyHours) * 100 : 0;

            // Breakdowns
            const revenueByFamily: Record<string, number> = {};
            const revenueByType: Record<string, number> = { "services": 0, "products": 0, "vouchers": 0, "gift_cards": 0, "unknown": 0 };

            profSalesData.forEach(sale => {
              // Aggregate Family
              const fam = sale.category || "Sin Familia";
              revenueByFamily[fam] = (revenueByFamily[fam] || 0) + (sale.totalAmount || 0);
              
              // Aggregate Classified Type
              const typeMap: Record<string, string> = { "service": "services", "product": "products", "voucher": "vouchers", "gift_card": "gift_cards" };
              const mappedType = typeMap[sale.classifiedType] || "unknown";
              revenueByType[mappedType] += (sale.totalAmount || 0);
            });

            return (
              <>
                {/* BLOQUE 2: KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#1A1A1A', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A' }}>
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Facturación</p>
                    <p className="brand-font" style={{ fontSize: '1.75rem', color: 'var(--primary)', margin: 0, lineHeight: 1 }}>{totalRevenue.toFixed(2)}€</p>
                  </div>
                  <div style={{ backgroundColor: '#1A1A1A', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A' }}>
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Coste del periodo</p>
                    <p className="brand-font" style={{ fontSize: '1.75rem', color: '#ef4444', margin: 0, lineHeight: 1 }}>{periodCost.toFixed(2)}€</p>
                  </div>
                  <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${grossResult >= 0 ? 'var(--primary)' : '#ef4444'}` }}>
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Resultado bruto</p>
                    <p className="brand-font" style={{ fontSize: '1.75rem', color: grossResult >= 0 ? 'var(--foreground)' : '#ef4444', margin: 0, lineHeight: 1 }}>{grossResult > 0 ? '+' : ''}{grossResult.toFixed(2)}€</p>
                  </div>
                  <div style={{ backgroundColor: '#1A1A1A', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #2A2A2A' }}>
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Coste x Hora</p>
                    <p className="brand-font" style={{ fontSize: '1.75rem', color: 'var(--foreground)', margin: 0, lineHeight: 1 }}>{hourlyCost.toFixed(2)}€</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  
                  {/* BLOQUE 3: Objetivos */}
                  <div className="editorial-panel" style={{ padding: '2rem' }}>
                    <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: '0 0 1.5rem 0' }}>Objetivos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      <div style={{ padding: '1rem', backgroundColor: '#111', borderRadius: '0.5rem', border: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Objetivo Mínimo</span>
                          <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{targetMin.toFixed(2)}€</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(complianceMinimum, 100)}%`, height: '100%', backgroundColor: complianceMinimum >= 100 ? 'var(--primary)' : 'var(--accent-foreground)', transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                          <span style={{ color: diffVsMinimum >= 0 ? 'var(--primary)' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>{diffVsMinimum >= 0 ? `+${diffVsMinimum.toFixed(2)}` : diffVsMinimum.toFixed(2)}€</span>
                          <span style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontWeight: 600 }}>{complianceMinimum.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div style={{ padding: '1rem', backgroundColor: '#111', borderRadius: '0.5rem', border: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Objetivo Saludable</span>
                          <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{targetHealth.toFixed(2)}€</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(complianceHealthy, 100)}%`, height: '100%', backgroundColor: complianceHealthy >= 100 ? 'var(--primary)' : '#3b82f6', transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                          <span style={{ color: diffVsHealthy >= 0 ? 'var(--primary)' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>{diffVsHealthy >= 0 ? `+${diffVsHealthy.toFixed(2)}` : diffVsHealthy.toFixed(2)}€</span>
                          <span style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontWeight: 600 }}>{complianceHealthy.toFixed(0)}%</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* BLOQUE 4: Tiempo */}
                  <div className="editorial-panel" style={{ padding: '2rem' }}>
                    <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--accent-foreground)', margin: '0 0 1.5rem 0' }}>Tiempo Estimado</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed #333' }}>
                        <span style={{ color: 'var(--text-soft)' }}>Horas teóricas</span>
                        <span className="brand-font" style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>{monthlyHours.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>h</span></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed #333' }}>
                        <span style={{ color: 'var(--text-soft)' }}>Horas efectivas <span style={{fontSize:'0.7rem', display:'block', color:'var(--text-muted)'}}>(Basado en servicios realizados)</span></span>
                        <span className="brand-font" style={{ fontSize: '1.5rem', color: 'var(--foreground)' }}>{effectiveHours.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>h</span></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #222' }}>
                        <span style={{ color: 'var(--text-soft)', fontWeight: 500 }}>% Ocupación</span>
                        <span className="brand-font" style={{ fontSize: '2rem', color: occupancy >= 70 ? 'var(--primary)' : 'var(--foreground)', lineHeight: 1 }}>{occupancy.toFixed(0)} <span style={{ fontSize: '1.25rem' }}>%</span></span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BLOQUE 5: Desgloses */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  <div className="editorial-panel" style={{ padding: '2rem' }}>
                    <h3 className="brand-font" style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: '0 0 1rem 0', display:'flex', alignItems:'center', gap: '0.5rem' }}>
                      <Briefcase size={16}/> Por Categoría (Familia)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(revenueByFamily).sort((a,b) => b[1] - a[1]).map(([fam, amount]) => (
                        <div key={fam} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a' }}>
                          <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>{fam}</span>
                          <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{amount.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="editorial-panel" style={{ padding: '2rem' }}>
                    <h3 className="brand-font" style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: '0 0 1rem 0', display:'flex', alignItems:'center', gap: '0.5rem' }}>
                      <Activity size={16}/> Por Tipo de Venta
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>Servicios</span>
                        <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{revenueByType.services.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>Productos</span>
                        <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{revenueByType.products.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>Bonos</span>
                        <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{revenueByType.vouchers.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>Tarjetas Regalo</span>
                        <span style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontWeight: 500 }}>{revenueByType.gift_cards.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}

      {/* DAYS MODAL */}
      {showDaysModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.5rem', width: '90%', maxWidth: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>Ajustar bolsa</h3>
              <button onClick={() => setShowDaysModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDays} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Días anuales asignados</label>
                <input 
                  type="number" 
                  min="0"
                  value={daysFormData.vacationDays}
                  onChange={(e) => setDaysFormData({ vacationDays: parseInt(e.target.value, 10) || 0 })}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                />
              </div>
              <button type="submit" style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                Actualizar bolsa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VACATION MODAL */}
      {showVacationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingVacationId ? 'Editar Vacación' : 'Nueva Vacación'}
              </h3>
              <button 
                onClick={() => setShowVacationModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveVacation} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {vacationFormError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.35rem', fontSize: '0.85rem' }}>
                  {vacationFormError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de inicio *</label>
                  <input 
                    type="date" 
                    value={vacationFormData.startDate}
                    onChange={(e) => setVacationFormData({...vacationFormData, startDate: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de fin *</label>
                  <input 
                    type="date" 
                    value={vacationFormData.endDate}
                    onChange={(e) => setVacationFormData({...vacationFormData, endDate: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Estado</label>
                <select 
                  value={vacationFormData.status}
                  onChange={(e) => setVacationFormData({...vacationFormData, status: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                >
                  <option value="Aprobada">Aprobada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Observaciones</label>
                <textarea 
                  value={vacationFormData.notes}
                  onChange={(e) => setVacationFormData({...vacationFormData, notes: e.target.value})}
                  rows={3}
                  placeholder="Detalles adicionales opcionales..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingVacationId ? 'Guardar cambios' : 'Añadir vacación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABSENCE MODAL */}
      {showAbsenceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 className="brand-font" style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingAbsenceId ? 'Editar Ausencia' : 'Nueva Ausencia'}
              </h3>
              <button 
                onClick={() => setShowAbsenceModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {absenceFormError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.35rem', fontSize: '0.85rem' }}>
                  {absenceFormError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo de ausencia *</label>
                <select 
                  value={absenceFormData.type}
                  onChange={(e) => setAbsenceFormData({...absenceFormData, type: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                >
                  <option value="Baja laboral">Baja laboral</option>
                  <option value="Permiso">Permiso</option>
                  <option value="Ausencia puntual">Ausencia puntual</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de inicio *</label>
                  <input 
                    type="date" 
                    value={absenceFormData.startDate}
                    onChange={(e) => setAbsenceFormData({...absenceFormData, startDate: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de fin *</label>
                  <input 
                    type="date" 
                    value={absenceFormData.endDate}
                    onChange={(e) => setAbsenceFormData({...absenceFormData, endDate: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Estado</label>
                <select 
                  value={absenceFormData.status}
                  onChange={(e) => setAbsenceFormData({...absenceFormData, status: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)' }}
                >
                  <option value="Activa">Activa</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Observaciones</label>
                <textarea 
                  value={absenceFormData.notes}
                  onChange={(e) => setAbsenceFormData({...absenceFormData, notes: e.target.value})}
                  rows={3}
                  placeholder="Detalles adicionales opcionales..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.35rem', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: 'var(--foreground)', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingAbsenceId ? 'Guardar cambios' : 'Añadir ausencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
