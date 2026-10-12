// Componente raíz de la aplicación (App.tsx).
// Responsable de definir la configuración del enrutador (React Router v6) y establecer 
// el layout principal que envuelve a todas las páginas. También inyecta contextos globales
// (como el modal de autenticación) y maneja el restablecimiento del scroll al cambiar de ruta.
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Home } from '../features/home/pages/Home';
import { AuthProvider } from '../core/context/AuthContext';
import { AuthModalProvider } from '../core/context/AuthModalContext';
import { AuthModal } from '../features/user/components/AuthModal';
import { AdRotator } from '../features/ad/components/AdRotator';
import { ProtectedRoute } from '../core/components/ProtectedRoute';
import { Loader } from '../core/components/Loader';

// Carga diferida de las páginas (code splitting).
//
// Antes todas las páginas se importaban acá arriba, así que abrir la home
// descargaba (y en desarrollo, compilaba uno por uno) los ~600 archivos de la
// app entera, incluido el panel de admin. Con lazy() cada página se pide recién
// la primera vez que se entra a su ruta. La Home queda importada normal porque
// es la puerta de entrada: esperarla por separado solo agregaría una demora.
//
// lazy() espera un módulo con export default y nuestras páginas usan export con
// nombre, por eso el .then() que adapta el módulo a esa forma.
const MusicExplorePage = lazy(() =>
  import('../features/music/pages/MusicExplorePage').then((m) => ({ default: m.MusicExplorePage }))
);
const GenreDetailPage = lazy(() =>
  import('../features/genre/pages/GenreDetailPage').then((m) => ({ default: m.GenreDetailPage }))
);
const AlbumDetailPage = lazy(() =>
  import('../features/album/pages/AlbumDetailPage').then((m) => ({ default: m.AlbumDetailPage }))
);
const AlbumsExplorePage = lazy(() =>
  import('../features/album/pages/AlbumsExplorePage').then((m) => ({ default: m.AlbumsExplorePage }))
);
const SongDetailPage = lazy(() =>
  import('../features/song/pages/SongDetailPage').then((m) => ({ default: m.SongDetailPage }))
);
const SongsExplorePage = lazy(() =>
  import('../features/song/pages/SongsExplorePage').then((m) => ({ default: m.SongsExplorePage }))
);
const ReviewsExplorePage = lazy(() =>
  import('../features/review/pages/ReviewsExplorePage').then((m) => ({ default: m.ReviewsExplorePage }))
);
const ReviewDetailPage = lazy(() =>
  import('../features/review/pages/ReviewDetailPage').then((m) => ({ default: m.ReviewDetailPage }))
);
const UserProfilePage = lazy(() =>
  import('../features/user/pages/UserProfilePage').then((m) => ({ default: m.UserProfilePage }))
);
const AdminPage = lazy(() =>
  import('../features/user/pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const ProCheckoutPage = lazy(() =>
  import('../features/membership/pages/ProCheckoutPage').then((m) => ({ default: m.ProCheckoutPage }))
);
const ProPage = lazy(() =>
  import('../features/membership/pages/ProPage').then((m) => ({ default: m.ProPage }))
);
const ProReturnPage = lazy(() =>
  import('../features/membership/pages/ProReturnPage').then((m) => ({ default: m.ProReturnPage }))
);
const ListsExplorePage = lazy(() =>
  import('../features/list/pages/ListsExplorePage').then((m) => ({ default: m.ListsExplorePage }))
);
const ListDetailPage = lazy(() =>
  import('../features/list/pages/ListDetailPage').then((m) => ({ default: m.ListDetailPage }))
);

// Static Info Pages
const TermsPage = lazy(() =>
  import('../features/home/pages/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('../features/home/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const FaqPage = lazy(() =>
  import('../features/home/pages/FaqPage').then((m) => ({ default: m.FaqPage }))
);
const ContactPage = lazy(() =>
  import('../features/home/pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);

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
          {/* Mientras llega el código de una página diferida (ver lazy() arriba)
              se muestra el mismo Loader que usan las pantallas al pedir datos. */}
          <Suspense fallback={<Loader fullPage />}>
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
              {/* Feed social: es una vitrina pública, como /music. Sin sesión se
                  ve el feed de la comunidad, y la solapa "Amigos" abre el modal de
                  registro (ver ReviewsExplorePage). */}
              <Route path="/reviews" element={<ReviewsExplorePage />} />
              <Route path="/lists" element={<ListsExplorePage />} />

              {/* Ficha de una lista personalizada: es pública, mismo criterio que
                  /reviews/:id, porque es el destino de un enlace que se comparte.
                  La API también es pública; con sesión se suman los controles de
                  dueño (editar, borrar, agregar o sacar álbumes) y liked_by_me. */}
              <Route path="/lists/:id" element={<ListDetailPage />} />

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

              {/* La sección se llamaba "Miembros" y vivía en /members cuando
                  mostraba perfiles. Se mantiene la URL vieja redirigiendo, por el
                  mismo motivo que la de arriba. */}
              <Route path="/members" element={<Navigate to="/reviews" replace />} />
            </Routes>
          </Suspense>
        </div>
        <AuthModal />

        {/* La publicidad que ve un usuario Free. Va acá afuera y no adentro del
            div de arriba a propósito: ese div se remonta en cada cambio de ruta
            por su `key`, y con él se reiniciaría el reloj del próximo anuncio,
            que nunca llegaría a cumplir su espera. Quién lo ve y cada cuánto
            aparece lo decide el propio AdRotator. */}
        <AdRotator />
      </AuthModalProvider>
    </AuthProvider>
  );
};

