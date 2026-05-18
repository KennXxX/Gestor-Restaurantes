import { Routes, Route } from 'react-router-dom'
import { AuthPage } from '../../features/auth/pages/AuthPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage'
import { DashboardPage } from '../layouts/DashboardPage.jsx'
import { ClientPage, ClientHome, ClientReservations, ClientMenu, ClientInvoices, ClientOrders } from '../pages/ClientPage'
import { ClientReviews } from '../../features/Resenas/ClientReviews'
import { ProtectedRoute } from './ProtectedRoute'
import { UserProfile } from '../../features/auth/components/UserProfile'
import { RoleGuard } from './RoleGuard'
import { LandingPage } from '../pages/LandingPage'
import { Facturas } from '../../features/Facturas/Facturas'
import { Estadisticas } from '../../features/Estadisticas/Estadisticas'
import { Restaurantes } from '../../features/Restaurantes/Restaurantes'
import { Mesas } from '../../features/Mesas/Mesas'
import { Inventory } from '../../features/inventory/components/Inventory'
import { Menus } from '../../features/Menus/Menus'
import { Resenas } from '../../features/Resenas/Resenas'
import { Orders } from '../../features/Orders/Orders'
import { AdminRestaurantes } from '../../features/AdminRestaurantes/AdminRestaurantes'
import { Reservations } from '../../features/Reservations/Reservations'
import { ClientesFrecuentes } from '../../features/ClientesFrecuentes/ClientesFrecuentes'
import { PublicRestaurantsPage } from '../pages/PublicRestaurantsPage'
import { AdminRestaurantePage } from '../pages/AdminRestaurantePage'
import { AdminRestauranteHome } from '../../features/AdminRestaurantes/AdminRestauranteHome'
import { AdminUsuarios } from '../../features/AdminUsuarios/AdminUsuarios'

import { useAuthStore } from '../../features/auth/store/authStore'

export const AppRoutes = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/restaurantes" element={<PublicRestaurantsPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN_ROLE']}>
              <DashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="restaurantes" element={<Restaurantes />} />
        <Route path="mesas" element={<Mesas />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="menus" element={<Menus />} />
        <Route path="orders" element={<Orders />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="admin-restaurantes" element={<AdminRestaurantes />} />
        <Route path="clientes-frecuentes" element={<ClientesFrecuentes />} />
        <Route path="resenas" element={<Resenas />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>
      <Route
        path="/admin-restaurante"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN_RESTAURANT']}>
              <AdminRestaurantePage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminRestauranteHome />} />
        <Route path="menus" element={<Menus />} />
        <Route path="mesas" element={<Mesas />} />
        <Route path="orders" element={<Orders />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="resenas" element={<Resenas />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="estadisticas" element={<Estadisticas />} />
      </Route>
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['USER_ROLE']}>
              <ClientPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHome />} />
        <Route path="reservations" element={<ClientReservations />} />
        <Route path="menu" element={<ClientMenu />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="reviews" element={<ClientReviews />} />
        <Route path="profile" element={<UserProfile user={user} />} />
      </Route>
   
    </Routes>
  )
}
