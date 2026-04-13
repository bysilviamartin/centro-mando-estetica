"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Wallet, 
  Building2, 
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Settings,
  Download,
  ClipboardCheck,
  ListTree,
  LifeBuoy
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const topLinks = [
  { href: "/", label: "Inicio", icon: BarChart3 },
  { href: "/treasury", label: "Tesorería", icon: Building2 },
  { href: "/teams", label: "Equipo", icon: Users },
  { href: "/fiscal", label: "Fiscal", icon: FileText },
  { href: "/services", label: "Servicios", icon: Store },
  { href: "/products", label: "Productos", icon: Wallet },
  { href: "/historical", label: "Histórico", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: ListTree },
];

  const bottomLinks: { href: string; label: string; icon: any }[] = [];

  return (
    <>
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 35,
            display: "block"
          }}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`} style={{ zIndex: 40 }}>
        <div className="sidebar-header">
          <div>
            <h1 className="sidebar-brand-logo brand-font">Silvia Martín</h1>
            <p className="sidebar-logo-subtext">ESTETICA AVANZADA</p>
          </div>
        </div>
        
        <div className="sidebar-group-title">Módulos</div>
        
        <nav className="sidebar-nav">
          {topLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href + index}
                href={link.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon />
                <span className="sidebar-link-text">{link.label}</span>
              </Link>
            );
          })}


          {bottomLinks.map((link, index) => {
  const Icon = link.icon;
  const isActive = pathname === link.href;
  return (
    <Link
      key={link.href + index}
      href={link.href}
      className={`sidebar-link ${isActive ? "active" : ""}`}
      onClick={() => setIsOpen(false)}
    >
      <Icon size={18} />
      <span>{link.label}</span>
    </Link>
  );
})}
        </nav>

        {/* Desktop Collapse Toggle */}
        <button 
          className="sidebar-collapse-btn hidden md:flex" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          style={{ marginTop: 'auto', display: 'flex' }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
