import { Routes, Route } from 'react-router-dom'
import { AuthPage } from '../../features/auth/pages/AuthPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage'
import { DashboardPage } from '../layouts/DashboardPage.jsx'
import { ClientPage } from '../pages/ClientPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'
import { Facturas } from '../../features/Facturas/Facturas'
import { Estadisticas } from '../../features/Estadisticas/Estadisticas'
import { Restaurantes } from '../../features/Restaurantes/Restaurantes'
import { Mesas } from '../../features/Mesas/Mesas'
import { Inventory } from '../../features/inventory/components/Inventory'
import { Menus } from '../../features/Menus/Menus'
import { Resenas } from '../../features/Resenas/Resenas'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
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
        <Route path="resenas" element={<Resenas />} />
        <Route path="inventory" element={<Inventory />} />
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
      />
   
    </Routes>
  )
}
   //AGREGAR RUTA DE INVENTARIO