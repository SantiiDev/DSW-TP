// Envoltorio de rutas privadas: deja pasar solo si hay sesión y, opcionalmente,
// solo si el usuario tiene alguno de los roles pedidos.
//
// Se usa en App.tsx envolviendo el elemento de la ruta:
//
//   <Route path="/profile" element={
//     <ProtectedRoute><UserProfilePage /></ProtectedRoute>
//   } />
//
//   <Route path="/admin/moderation" element={
//     <ProtectedRoute roles={['ADMIN']}><ModerationPage /></ProtectedRoute>
//   } />
//
// OJO: esto es solo para la experiencia de usuario, para no mostrar pantallas que
// no va a poder usar. La validación que importa vive en el backend (requireAuth y
// requireRole): cualquiera puede editar el estado del navegador, pero no puede
// falsificar la firma de un token.
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../features/user/models/User';
import { Loader } from './Loader';

type ProtectedRouteProps = {
  children: ReactNode;
  /** Roles habilitados. Si no se pasa ninguno, alcanza con estar logueado. */
  roles?: UserRole[];
  /** A dónde mandar al usuario que no tiene permiso. */
  redirectTo?: string;
};

export const ProtectedRoute = ({ children, roles, redirectTo = '/' }: ProtectedRouteProps) => {
  const { state } = useAuth();

  // Mientras se valida el token guardado no se puede decidir todavía: si se
  // redirigiera acá, al recargar una ruta privada el usuario se quedaría afuera
  // aunque su sesión siguiera siendo válida.
  if (state.status === 'checking') {
    return <Loader message="Verificando tu sesión..." />;
  }

  if (state.status !== 'authenticated' || !state.user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !state.user.hasAnyRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
