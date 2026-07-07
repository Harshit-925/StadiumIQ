/**
 * ProtectedRoute — React Router v6 layout route that guards auth-required pages.
 *
 * Uses <Outlet /> pattern: wrap protected routes in <Route element={<ProtectedRoute />}>.
 * Unauthenticated users are redirected to /login (state preserved for after-login redirect).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the attempted URL so LoginPage can redirect back after auth
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
