// Componente raíz de la aplicación (App.tsx).
// Responsable de definir la configuración del enrutador (React Router v6) y establecer 
// el layout principal que envuelve a todas las páginas. También inyecta contextos globales
// (como el modal de autenticación) y maneja el restablecimiento del scroll al cambiar de ruta.
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from '../features/home/Home';
import { MusicExplorePage } from '../features/music/pages/MusicExplorePage';
import { GenreDetailPage } from '../features/genre/pages/GenreDetailPage';
import { AlbumDetailPage } from '../features/album/pages/AlbumDetailPage';
import { AlbumsExplorePage } from '../features/album/pages/AlbumsExplorePage';
import { SongDetailPage } from '../features/song/pages/SongDetailPage';
import { SongsExplorePage } from '../features/song/pages/SongsExplorePage';
import { MembersExplorePage } from '../features/user/pages/MembersExplorePage';
import { UserProfilePage } from '../features/user/pages/UserProfilePage';
import { AdminPage } from '../features/user/pages/AdminPage';
import { ProCheckoutPage } from '../features/membership/pages/ProCheckoutPage';
import { ProPage } from '../features/membership/pages/ProPage';
import { ProReturnPage } from '../features/membership/pages/ProReturnPage';
import { ListsExplorePage } from '../features/review/pages/ListsExplorePage';
import { ReviewDetailPage } from '../features/review/pages/ReviewDetailPage';
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

            {/* --- Catálogo: pide sesión -----------------------------------
                /music es la vitrina: se ve sin cuenta y muestra el catálogo real,
                pero entrar a una ficha o a un listado pide estar registrado. Es
                el mismo corte que hacen las tarjetas del explorador, que sin
                sesión abren el modal de registro en vez de navegar (ver
                core/components/GatedLink).

                La API de estas pantallas es pública igual: no se está protegiendo
                un dato sensible, se pide la cuenta para poder reseñar y seguir
                gente, que es de lo que se trata Musicboxd. */}
            <Route
              path="/genres/:id"
              element={
                <ProtectedRoute>
                  <GenreDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Listados del explorador: es a donde llevan los "Ver todos" de
                /music y las tarjetas de "Explorar por Década". Qué se lista lo
                dicen los parámetros de la URL (?sort=, ?year_from=...). */}
            <Route
              path="/albums"
              element={
                <ProtectedRoute>
                  <AlbumsExplorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/songs"
              element={
                <ProtectedRoute>
                  <SongsExplorePage />
                </ProtectedRoute>
              }
            />

            {/* Fichas de álbum y de canción, con su tracklist y sus reseñas. */}
            <Route
              path="/albums/:id"
              element={
                <ProtectedRoute>
                  <AlbumDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/songs/:id"
              element={
                <ProtectedRoute>
                  <SongDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/members" element={<MembersExplorePage />} />
            <Route path="/lists" element={<ListsExplorePage />} />

            {/* Página de una reseña: el detalle del listado de reseñas del
                perfil, y el destino del botón "Compartir".

                Es de las pocas rutas públicas, y a propósito: un enlace
                compartido lo tiene que poder abrir alguien que todavía no tiene
                cuenta. La API del detalle también es pública. Adentro, lo que
                lleva al catálogo va con GatedLink, así que quien llega sin sesión
                lee la reseña y desde ahí se registra. */}
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            <Route path="/pro" element={<ProPage />} />

            {/* Static Pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Resumen de la contratación, antes de salir hacia MercadoPago.
                Es privada porque contratar exige tener cuenta. */}
            <Route
              path="/pro/checkout"
              element={
                <ProtectedRoute>
                  <ProCheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Vuelta de MercadoPago. Es privada porque la confirmación del pago
                necesita el token: la API tiene que saber quién volvió. */}
            <Route
              path="/pro/return"
              element={
                <ProtectedRoute>
                  <ProReturnPage />
                </ProtectedRoute>
              }
            />

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

