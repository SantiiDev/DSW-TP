// Componente raíz de la aplicación (App.tsx).
// Responsable de definir la configuración del enrutador (React Router v6) y establecer 
// el layout principal que envuelve a todas las páginas. También inyecta contextos globales
// (como el modal de autenticación) y maneja el restablecimiento del scroll al cambiar de ruta.
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from '../features/home/Home';
import { MusicExplorePage } from '../features/music/pages/MusicExplorePage';
import { MembersExplorePage } from '../features/user/pages/MembersExplorePage';
import { UserProfilePage } from '../features/user/pages/UserProfilePage';
import { AdminPage } from '../features/user/pages/AdminPage';
import { ProPage } from '../features/membership/pages/ProPage';
import { ListsExplorePage } from '../features/review/pages/ListsExplorePage';
import { AuthProvider } from '../core/context/AuthContext';
import { AuthModalProvider } from '../core/context/AuthModalContext';
import { AuthModal } from '../features/user/components/AuthModal';
import { ProtectedRoute } from '../core/components/ProtectedRoute';

// Static Info Pages
import { TermsPage } from '../features/home/pages/TermsPage';
import { PrivacyPage } from '../features/home/pages/PrivacyPage';
import { FaqPage } from '../features/home/pages/FaqPage';
import { ContactPage } from '../features/home/pages/ContactPage';

export const App = () => {
  const location = useLocation();

  useEffect(() => {
    // Usamos setTimeout para evitar que la restauración automática de scroll del navegador
    // sobrescriba nuestro scroll, y para dar tiempo a que el DOM se actualice completamente
    // después de los remounts causados por el cambio de key.
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    // AuthProvider envuelve a todo: la sesión la necesitan tanto el modal de
    // autenticación como el Navbar y las rutas protegidas.
    <AuthProvider>
      <AuthModalProvider>
        <div key={location.pathname} className="fade-in">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/music" element={<MusicExplorePage />} />
            <Route path="/members" element={<MembersExplorePage />} />
            <Route path="/lists" element={<ListsExplorePage />} />
            <Route path="/pro" element={<ProPage />} />

            {/* Static Pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Rutas privadas: solo entran si hay sesión (ver ProtectedRoute). */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Perfil público de otro usuario: la misma página, en solo lectura.
                Pide sesión porque la API exige token en todos sus endpoints. */}
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Panel de administración: además de sesión exige rol ADMIN.
                Adentro se divide en pestañas (usuarios, música, solicitudes). */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* El panel vivía en /admin/users cuando solo gestionaba cuentas.
                Se mantiene la URL vieja redirigiendo, para no romper links ya
                guardados. */}
            <Route path="/admin/users" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  );
};

