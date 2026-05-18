import { Outlet } from 'react-router-dom'
import { Navbar } from '../../shared/components/layout/Navbar'
import { AdminRestauranteSidebar } from '../../shared/components/layout/AdminRestauranteSidebar'

export const AdminRestaurantePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <Navbar />
      <div className="flex flex-1">
        <AdminRestauranteSidebar />
        <main className="flex-1 min-w-0 p-7 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
