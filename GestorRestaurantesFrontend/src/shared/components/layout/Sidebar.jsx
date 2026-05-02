import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
    const location = useLocation();

    const items = [
        
        { label: "Mesas", to: "/dashboard/mesas" },
        { label: "Reservaciones", to: "/dashboard/reservations" },
        { label: "Restaurantes", to: "/dashboard/restaurantes" },
        { label: "Inventario", to: "/dashboard/inventory" }
    ];

    return (
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-5rem)] p-4 shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Menú Principal</h2>
                <hr className="border-orange-500 mt-2" />
            </div>
            <ul className="space-y-2">
                {items.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);

                    return (
                        <li key={item.to}>
                            <Link
                                to={item.to}
                                className={`flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                    isActive
                                        ? "bg-orange-500 text-white shadow-lg"
                                        : "text-white hover:bg-gray-700 hover:text-white"
                                }`}
                            >
                                <span className="text-white">{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

