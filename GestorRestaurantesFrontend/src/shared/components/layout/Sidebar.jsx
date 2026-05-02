import { Link, useLocation } from "react-router-dom"
 
 
export const Sidebar = () => {
    const location = useLocation()
 
    const items = [
        { label: "Mesas", to: "/dashboard/mesas"},
        { label: "Menús", to: "/dashboard/menus"},
        { label: "Reservaciones", to: "/dashboard/reservations"},
        { label: "Restaurantes", to: "/dashboard/restaurantes" },
        { label: "Reseñas", to: "/dashboard/resenas" },
        { label: "Facturas", to: "/dashboard/facturas"},
        { label: "Estadísticas", to: "/dashboard/estadisticas"}
    ]
 
 
  return (
    <aside className="w-60 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm">
        <ul className="space-y-1">
            {items.map((item) => {
                const Active = location.pathname === item.to
 
                return (
                    <li key={item.to}>
                        <Link
                            to={item.to}
                            className={`block py-2 px-4 rounded-lg font-medium transition-colors sidebar-underline ${
                                Active
                                    ? "active text-main-blue"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                            style={Active ? { fontWeight: 700 } : {}}
                        >
                            {item.label}
                        </Link>
                    </li>
                )
 
            })}
        </ul>
 
    </aside>
  )
}
 
 