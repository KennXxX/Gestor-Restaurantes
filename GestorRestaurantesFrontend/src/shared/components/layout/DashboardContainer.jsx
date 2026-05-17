import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

export const DashboardContainer = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-body">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 min-w-0 p-7 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
