export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "240px",
          borderRight: "1px solid #1f1f1f",
          padding: "24px",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            color: "#c9a882",
            marginBottom: "24px",
            fontSize: "14px",
            letterSpacing: "0.1em",
          }}
        >
          SM ESTÉTICA
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a href="/" style={{ color: "#fff", textDecoration: "none" }}>
            Control diario
          </a>

          <a href="/control-diario" style={{ color: "#888", textDecoration: "none" }}>
            Dashboard
          </a>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}