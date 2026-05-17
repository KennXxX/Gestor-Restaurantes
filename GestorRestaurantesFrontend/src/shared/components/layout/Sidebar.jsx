import { Link, useLocation } from "react-router-dom";

const navSections = [
  {
    label: "Operaciones",
    items: [
      { label: "Inicio", to: "/dashboard", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M9 21V13h6v8"/></svg>) },
      { label: "Mesas", to: "/dashboard/mesas", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v12M19 7v12M8 19h8"/></svg>) },
      { label: "Menús", to: "/dashboard/menus", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>) },
      { label: "Órdenes", to: "/dashboard/orders", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>) },
      { label: "Reservaciones", to: "/dashboard/reservations", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) },
      { label: "Inventario", to: "/dashboard/inventory", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>) },
    ],
  },
  {
    label: "Clientes",
    items: [
      { label: "Clientes Frecuentes", to: "/dashboard/clientes-frecuentes", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>) },
      { label: "Reseñas", to: "/dashboard/resenas", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>) },
      { label: "Promociones", to: "/dashboard/promociones", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>) },
    ],
  },
  {
    label: "Administración",
    items: [
      { label: "Restaurantes", to: "/dashboard/restaurantes", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>) },
      { label: "Facturas", to: "/dashboard/facturas", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>) },
      { label: "Estadísticas", to: "/dashboard/estadisticas", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>) },
      { label: "Admins Restaurante", to: "/dashboard/admin-restaurantes", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>) },
    ],
  },
];

const SidebarLink = ({ item, isActive }) => (
  <Link to={item.to} className={`sidebar-link${isActive ? " active" : ""}`}>
    <span className="icon-wrap">{item.icon}</span>
    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {item.label}
    </span>
    {isActive && (
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: "#60a5fa", flexShrink: 0,
        boxShadow: "0 0 6px rgba(96,165,250,0.8)"
      }} />
    )}
  </Link>
);

export const Sidebar = ({ items }) => {
  const location = useLocation();

  if (items) {
    return (
      <aside style={{
        width: "185px", flexShrink: 0,
        position: "sticky", top: "64px",
        height: "calc(100vh - 64px)",
        background: "#0f1623",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        padding: "16px 8px", gap: "2px",
        overflowY: "auto"
      }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          {items.map((item) => {
            const isActive = item.to === '/dashboard' || item.to === '/admin-restaurante'
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <SidebarLink item={item} isActive={isActive} />
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  return (
    <aside style={{
      width: "185px", flexShrink: 0,
      position: "sticky", top: "64px",
      height: "calc(100vh - 64px)",
      background: "#0f1623",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column",
      padding: "12px 8px",
      overflowY: "auto"
    }}>
      {navSections.map((section) => (
        <div key={section.label} style={{ marginBottom: "12px" }}>
          <p style={{
            fontSize: "0.58rem", fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(100,116,139,0.8)",
            padding: "0 12px", margin: "0 0 4px"
          }}>
            {section.label}
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {section.items.map((item) => {
              const isActive = item.to === '/dashboard'
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <SidebarLink item={item} isActive={isActive} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
};
