// Feed de reseñas de la página /reviews, en sus dos modos: las de toda la
// comunidad y las de la gente que sigue el usuario.
//
// Es el contenedor que pide los datos y pagina; el dibujo lo hace ReviewList, el
// mismo que usan la ficha de un álbum y la pestaña "Reseñas" del perfil.
//
// Pagina por tandas acumulando, con el mismo patrón que UserReviewsList, y por
// eso NO usa useFetch: ese hook reemplaza los datos en cada carga y acá hay que
// sumar la tanda nueva a lo que ya se mostró.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../core/components/Button';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { scrollToSection } from '../../../core/utils/scrollToSection';
import { ReviewEditModal } from './ReviewEditModal';
import { ReviewList } from './ReviewList';
import { reviewService } from '../services/reviewService';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

/** Los dos modos del feed. Es el valor del toggle y el del parámetro ?scope. */
export type FeedScope = 'community' | 'friends';

/** Id del panel de gente para seguir, al que llevan los estados vacíos. */
export const SUGGESTIONS_SECTION_ID = 'gente-para-seguir';

/**
 * Cuántas reseñas trae cada tanda. Es el doble que en el perfil y en la ficha de
 * un álbum: acá el feed ES la pantalla, no una sección dentro de otra cosa.
 */
const PAGE_SIZE = 10;

type ReviewFeedProps = {
  scope: FeedScope;
  /**
   * A cuánta gente sigue el usuario. Es lo que distingue "todavía no seguís a
   * nadie" de "los que seguís no publicaron nada", que necesitan mensajes
   * distintos. null mientras no se sabe (sin sesión o sin respuesta todavía).
   */
  followingCount: number | null;
  /**
   * Cambia cada vez que se sigue o se deja de seguir a alguien desde el panel.
   * Está en las dependencias de la carga, así que el feed de amigos se rehace en
   * el acto: seguís a alguien y sus reseñas aparecen sin recargar la página.
   */
  followVersion: number;
};

export const ReviewFeed = ({ scope, followingCount, followVersion }: ReviewFeedProps) => {
  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();
  const currentUser = authState.user;
  const isAuthenticated = authState.status === 'authenticated';
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // true mientras se trae la primera tanda de OTRO modo, con algo ya en pantalla.
  // Va aparte de isLoading porque se dibuja distinto: ver loadFirstPage.
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  // La reseña que se está editando, o null si el diálogo está cerrado.
  const [editing, setEditing] = useState<Review | null>(null);

  // El feed de amigos necesita sesión: la API responde 401 sin token. Se corta
  // acá para cubrir el caso de alguien que pega ?scope=friends en la barra de
  // direcciones sin estar logueado.
  const isFriendsBlocked = scope === 'friends' && !isAuthenticated;

  // Si el feed ya mostró una tanda alguna vez. Es un ref y no un estado porque
  // solo decide CÓMO se dibuja la carga siguiente; cambiarlo no tiene que
  // provocar un dibujado de más.
  const hasLoadedOnce = useRef(false);

  const loadFirstPage = useCallback(async () => {
    if (isFriendsBlocked) {
      setReviews([]);
      setHasMore(false);
      setIsLoading(false);
      hasLoadedOnce.current = true;
      return;
    }

    // La primera carga tapa la columna con el cargador, porque no hay nada que
    // mostrar. Al cambiar de modo no: sacar las reseñas para poner el cargador
    // desploma el alto de la página y se ve como un tirón. Se dejan las de
    // antes atenuadas hasta que llega la tanda nueva.
    if (hasLoadedOnce.current) {
      setIsSwitching(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const batch = await reviewService.list({
        following: scope === 'friends',
        limit: PAGE_SIZE,
        offset: 0,
      });

      setReviews(batch);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
      setIsSwitching(false);
    }
    // followVersion no se usa adentro, pero está en las dependencias a propósito:
    // es lo que hace que seguir a alguien recargue el feed.
  }, [scope, isFriendsBlocked, followVersion]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const batch = await reviewService.list({
        following: scope === 'friends',
        limit: PAGE_SIZE,
        offset: reviews.length,
      });

      setReviews((current) => [...current, ...batch]);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Reemplaza una sola reseña en la lista, sin recargar: un refresh volvería a la
  // primera tanda y perdería lo que ya se trajo con "Ver más".
  const replaceReview = (updated: Review) => {
    setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleToggleLike = async (review: Review) => {
    // Sin sesión el corazón ya viene deshabilitado desde ReviewCard; esto cubre
    // el caso de una sesión que venció mientras la página estaba abierta.
    if (!isAuthenticated) {
      openSignup();
      return;
    }

    try {
      replaceReview(await reviewService.toggleLike(review.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      replaceReview(
        review.isHidden
          ? await reviewService.restore(review.id)
          : await reviewService.hide(review.id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    const id = toDelete.id;
    setToDelete(null);

    try {
      await reviewService.remove(id);
      await loadFirstPage();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /**
   * Qué decir cuando el feed vuelve vacío. Son cuatro situaciones distintas y
   * cada una necesita una salida distinta: mandar a explorar música no le sirve a
   * alguien que no sigue a nadie, y ofrecerle registrarse tampoco a quien ya
   * tiene cuenta.
   */
  const buildEmptyState = () => {
    if (isFriendsBlocked) {
      return {
        title: 'El feed de amigos es para gente con cuenta.',
        message: 'Creá la tuya y seguí a quien quieras leer.',
        action: <Button onClick={openSignup}>Registrarme</Button>,
      };
    }

    if (scope === 'friends') {
      // followingCount todavía puede ser null si la respuesta no llegó; en ese
      // caso se muestra el mensaje general, que sirve para los dos casos.
      if (followingCount === 0) {
        return {
          title: 'Todavía no seguís a nadie.',
          message:
            'El feed de amigos se arma con las reseñas de la gente que seguís. Empezá por el panel de acá al lado.',
          action: (
            <Button onClick={() => scrollToSection(SUGGESTIONS_SECTION_ID)}>
              Descubrir gente
            </Button>
          ),
        };
      }

      return {
        title: 'La gente que seguís todavía no publicó reseñas.',
        message: 'Cuando alguno califique un álbum o una canción, va a aparecer acá.',
        action: (
          <Button variant="outline" onClick={() => scrollToSection(SUGGESTIONS_SECTION_ID)}>
            Seguir a más gente
          </Button>
        ),
      };
    }

    return {
      title: 'Todavía no hay reseñas en Musicboxd.',
      message: 'Entrá a un álbum o a una canción y calificalo: tu reseña abre el feed.',
      action: <Button onClick={() => navigate('/music')}>Explorar música</Button>,
    };
  };

  const empty = buildEmptyState();

  return (
    <div className={`review-feed ${isSwitching ? 'review-feed--switching' : ''}`}>
      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        emptyTitle={empty.title}
        emptyMessage={empty.message}
        emptyAction={empty.action}
        currentUserId={currentUser?.id ?? null}
        isAdmin={currentUser?.isAdmin ?? false}
        onLoadMore={handleLoadMore}
        // Se edita en el mismo feed, sin salir de la lista: antes el lápiz
        // navegaba a la página de la reseña y había que volver a buscar dónde
        // se había quedado leyendo. Es el mismo criterio que en el perfil.
        onEdit={setEditing}
        onDelete={setToDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleLike={handleToggleLike}
      />

      {/* Editar la propia reseña sin salir del feed. Al guardar, la tarjeta se
          reemplaza en el lugar: recargar el feed volvería a la primera tanda y
          perdería lo que ya se trajo con "Ver más". */}
      <ReviewEditModal
        isOpen={editing !== null}
        review={editing}
        onClose={() => setEditing(null)}
        onSaved={replaceReview}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar la reseña"
        message="La reseña se borra definitivamente y el promedio del ítem se recalcula sin ella."
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
