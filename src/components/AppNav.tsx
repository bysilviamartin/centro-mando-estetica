import Link from "next/link";

const links = [
  { href: "/", label: "Control diario" },
  { href: "/control-diario", label: "Dashboard" },
];

export default function AppNav() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "28px",
        flexWrap: "wrap",
      }}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            padding: "10px 16px",
            borderRadius: "999px",
            border: "1px solid #c9a882",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "14px",
            background: "#111111",
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}