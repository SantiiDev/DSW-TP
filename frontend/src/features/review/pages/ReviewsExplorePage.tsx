// Página /reviews: el feed social de la comunidad.
//
// Reemplaza a la vieja sección "Miembros", que mostraba cuatro bloques de datos
// inventados dentro de los propios componentes. Acá todo sale de la API.
//
// Tiene dos modos, que elige el toggle de arriba:
//   Comunidad -> las reseñas más recientes de todo Musicboxd.
//   Amigos    -> solo las de la gente que sigue el usuario.
//
// Es una vitrina pública: sin cuenta se ve el feed de la comunidad, y tocar
// "Amigos" abre el modal de registro. Es el mismo corte que hace /music.
//
// La página no pide reseñas: de eso se encarga ReviewFeed. Lo que sí es suyo es
// el modo activo, cuánta gente sigue el usuario y avisarle al feed cuando eso
// cambió.
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { ViewSwitcher } from '../../../core/components/ViewSwitcher';
import type { ViewOption } from '../../../core/components/ViewSwitcher';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { followService } from '../../user/services/followService';
import { SuggestedUsersPanel } from '../../user/components/SuggestedUsersPanel';
import { ReviewFeed, SUGGESTIONS_SECTION_ID } from '../components/ReviewFeed';
import type { FeedScope } from '../components/ReviewFeed';
import '../styles/_reviews-explore.scss';

const SCOPE_OPTIONS: readonly ViewOption<FeedScope>[] = [
  { value: 'community', label: 'Comunidad' },
  { value: 'friends', label: 'Amigos' },
];

/** Texto de apoyo de la cabecera, distinto según el modo. */
const SCOPE_SUBTITLES: Record<FeedScope, string> = {
  community: 'Lo último que escuchó y calificó toda la comunidad de Musicboxd.',
  friends: 'Las reseñas de la gente que seguís, de la más reciente a la más vieja.',
};

export const ReviewsExplorePage = () => {
  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();
  const isAuthenticated = authState.status === 'authenticated';
  const currentUserId = authState.user?.id;

  const [searchParams, setSearchParams] = useSearchParams();

  // El modo vive en la URL y no en un useState, para que /reviews?scope=friends
  // se pueda compartir y para que el botón "atrás" del navegador vuelva al modo
  // anterior. Cualquier valor que no sea 'friends' cae en la comunidad: así un
  // link con un parámetro raro muestra algo razonable en vez de romperse.
  const scope: FeedScope = searchParams.get('scope') === 'friends' ? 'friends' : 'community';

  // A cuánta gente sigue el usuario. Lo necesita el feed para distinguir "no
  // seguís a nadie" de "los que seguís no publicaron nada".
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  // Se incrementa cada vez que se sigue o se deja de seguir a alguien desde el
  // panel. Es lo que hace que el feed de amigos se rehaga sin recargar la página.
  const [followVersion, setFollowVersion] = useState(0);

  const loadFollowingCount = useCallback(async () => {
    if (currentUserId === undefined) {
      setFollowingCount(null);
      return;
    }

    try {
      const stats = await followService.stats(currentUserId);
      setFollowingCount(stats.following);
    } catch {
      // Si falla, el feed muestra el mensaje general del vacío en vez del
      // específico. No es motivo para romper la página.
      setFollowingCount(null);
    }
  }, [currentUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFollowingCount();
  }, [loadFollowingCount, followVersion]);

  /**
   * Cambia de modo.
   *
   * El feed de amigos no existe sin sesión, así que al visitante se le ofrece la
   * cuenta en vez de mandarlo a una lista vacía que no tiene forma de llenar. La
   * URL no cambia y el toggle sigue marcado en "Comunidad": detrás del modal se
   * sigue viendo el feed público, no una pantalla en blanco.
   */
  const handleScopeChange = (next: FeedScope) => {
    if (next === 'friends' && !isAuthenticated) {
      openSignup();
      return;
    }

    // Sin `replace`, o sea empujando una entrada al historial: alternar y volver
    // con "atrás" es justamente lo que se espera de un toggle que está en la URL.
    setSearchParams(next === 'friends' ? { scope: 'friends' } : {});
  };

  /** Avisa que cambió a quién sigue el usuario, para rehacer el feed. */
  const handleFollowChange = () => setFollowVersion((current) => current + 1);

  return (
    <>
      <Navbar />

      <main className="reviews-explore">
        <FadeInSection delay={100}>
          <header className="reviews-explore__header">
            <h1 className="reviews-explore__title">Reseñas</h1>
            <p className="reviews-explore__subtitle">{SCOPE_SUBTITLES[scope]}</p>
          </header>
        </FadeInSection>

        <div className="reviews-explore__toggle">
          <ViewSwitcher
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={handleScopeChange}
            ariaLabel="Qué reseñas se están viendo"
          />
        </div>

        {/* El feed va ANTES que el panel en el DOM, y no al revés, para que en
            mobile —donde todo cae en una sola columna— lo primero que se vea sea
            el contenido y no la barra lateral. Así no hace falta ningún `order`
            en el CSS. */}
        <div className="reviews-explore__content">
          <div className="reviews-explore__main">
            <ReviewFeed
              // A propósito SIN key: con una, cambiar de modo desmontaba el feed
              // entero, la columna quedaba en el alto del cargador y la página
              // pegaba un salto. El feed ya se rehace solo cuando cambia `scope`,
              // y mientras tanto deja lo anterior a la vista.
              scope={scope}
              followingCount={followingCount}
              followVersion={followVersion}
            />
          </div>

          <aside className="reviews-explore__side" id={SUGGESTIONS_SECTION_ID}>
            <SuggestedUsersPanel onFollowChange={handleFollowChange} />
          </aside>
        </div>
      </main>

      <FadeInSection delay={200}>
        <Footer />
      </FadeInSection>
    </>
  );
};
