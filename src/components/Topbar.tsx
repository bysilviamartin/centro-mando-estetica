"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search, User } from "lucide-react";

export default function Topbar() {
  const pathname = usePathname();

  const titles: Record<string, string> = {
    "/": "INICIO",
    "/import": "Importaciones",
    "/review": "Movimientos pendientes",
    "/cash": "Actividad diaria",
    "/treasury": "CAJA Y TESORERIA",
    "/profitability": "Análisis de rentabilidad",
    "/taxes": "Previsión de impuestos",
    "/catalogs": "Gestión de catálogos",
    "/settings/products": "Productos de Venta",
    "/settings/products/cabina": "Productos Cabina",
    "/teams": "EQUIPO",
    "/fiscal": "FISCAL",
    "/services": "SERVICIOS",
    "/products": "PRODUCTOS",
    "/historical": "HISTÓRICO",
  };

  let title = titles[pathname] || "Dashboard";

  if (pathname.startsWith("/services/") && pathname !== "/services") {
    title = "FICHA DE SERVICIO";
  }
  if (pathname.startsWith("/products/") && pathname !== "/products") {
    title = "FICHA DE PRODUCTO";
  }

  return (
    <header className="topbar">
      <div
        className="flex items-center gap-4"
        style={{ display: "flex", gap: "1rem" }}
      >
        <button
          className="mobile-toggle"
          aria-label="Abrir menú"
          onClick={() => window.dispatchEvent(new Event("toggleSidebar"))}
        >
          <Menu size={24} color="var(--primary)" />
        </button>

        <h2
          className="topbar-title brand-font"
          style={{ fontSize: "22px", fontWeight: "600", color: "#ffffff" }}
        >
          {title}
        </h2>
      </div>

      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-soft)",
            }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            style={{
              padding: "0.5rem 1rem 0.5rem 2.25rem",
              borderRadius: "0px",
              border: "1px solid var(--border)",
              borderBottom: "1px solid var(--text-soft)",
              backgroundColor: "transparent",
              color: "var(--foreground)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "0.8rem",
              outline: "none",
              transition: "border-color var(--transition)",
            }}
            onFocus={(e) =>
              (e.target.style.borderBottomColor = "var(--primary)")
            }
            onBlur={(e) =>
              (e.target.style.borderBottomColor = "var(--text-soft)")
            }
          />
        </div>

        <button
          aria-label="Notificaciones"
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <Bell size={18} />
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "6px",
              height: "6px",
              backgroundColor: "var(--accent-foreground)",
              borderRadius: "50%",
            }}
          ></span>
        </button>

        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "var(--surface-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <User size={16} color="var(--primary)" />
        </div>
      </div>
    </header>
  );
}