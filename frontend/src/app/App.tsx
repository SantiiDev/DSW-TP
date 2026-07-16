// Componente raíz de la aplicación que define las rutas principales y el layout base.
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from '../features/home/Home';
import { MusicExplorePage } from '../features/music/pages/MusicExplorePage';
import { MembersExplorePage } from '../features/user/pages/MembersExplorePage';
import { ProPage } from '../features/membership/pages/ProPage';
import { ListsExplorePage } from '../features/review/pages/ListsExplorePage';
import { AuthModalProvider } from '../core/context/AuthModalContext';
import { AuthModal } from '../features/user/components/AuthModal';

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
    <AuthModalProvider>
      <div key={location.pathname} className="fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<MusicExplorePage />} />
          <Route path="/members" element={<MembersExplorePage />} />
          <Route path="/lists" element={<ListsExplorePage />} />
          <Route path="/pro" element={<ProPage />} />
        </Routes>
      </div>
      <AuthModal />
    </AuthModalProvider>
  );
};
