// Componente raíz de la aplicación (App.tsx).
// Responsable de definir la configuración del enrutador (React Router v6) y establecer 
// el layout principal que envuelve a todas las páginas. También inyecta contextos globales
// (como el modal de autenticación) y maneja el restablecimiento del scroll al cambiar de ruta.
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from '../features/home/Home';
import { MusicExplorePage } from '../features/music/pages/MusicExplorePage';
import { MembersExplorePage } from '../features/user/pages/MembersExplorePage';
import { UserProfilePage } from '../features/user/pages/UserProfilePage';
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
          </Routes>
        </div>
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  );
};

