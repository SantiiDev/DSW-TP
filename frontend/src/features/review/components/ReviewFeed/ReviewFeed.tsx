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
import { Button } from '../../../../core/components/Button';
import { ConfirmDialog } from '../../../../core/components/Modal';
import { useAuth } from '../../../../core/context/AuthContext';
import { useAuthModal } from '../../../../core/context/AuthModalContext';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { scrollToSection } from '../../../../core/utils/scrollToSection';
import { ReviewEditModal } from '../ReviewEditModal';
import { ReviewList } from '../ReviewList';
import { reviewService } from '../../services/reviewService';
import type { Review } from '../../models/Review';
import { SUGGESTIONS_SECTION_ID, getFeedEmptyState } from '../../models/feedEmptyState';
import type { FeedScope } from '../../models/feedEmptyState';
import './ReviewFeed.scss';

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

  // La solapa "Comunidad" es para leer al resto: las propias ya se ven en el
  // perfil. Sin sesión no hay nada que excluir, y el feed de amigos tampoco lo
  // necesita, porque uno no se sigue a sí mismo.
  const excludeMine = scope === 'community' && isAuthenticated;

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
      // Se pide una de más para saber si hay más sin necesitar el total: si
      // vuelven PAGE_SIZE + 1, la de más se descarta y "hay más" es verdad. Sin
      // esto, cuando el total es justo un múltiplo de PAGE_SIZE, "Ver más"
      // aparece igual aunque no quede nada, y el click de más parece no hacer nada.
      const batch = await reviewService.list({
        following: scope === 'friends',
        excludeMine,
        limit: PAGE_SIZE + 1,
        offset: 0,
      });

      setReviews(batch.slice(0, PAGE_SIZE));
      setHasMore(batch.length > PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
      setIsSwitching(false);
    }
    // excludeMine es lo que hace que al iniciar sesión sin recargar la página el
    // feed se rehaga: la solapa "Comunidad" deja afuera las reseñas propias, así
    // que lo que se muestra depende de quién mira.
  }, [scope, isFriendsBlocked, excludeMine]);

  // followVersion cambia cada vez que se sigue a alguien: es lo que hace que el
  // feed se recargue en ese caso.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage, followVersion]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const batch = await reviewService.list({
        following: scope === 'friends',
        excludeMine,
        limit: PAGE_SIZE + 1,
        offset: reviews.length,
      });

      setReviews((current) => [...current, ...batch.slice(0, PAGE_SIZE)]);
      setHasMore(batch.length > PAGE_SIZE);
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

  // Qué decir si el feed vuelve vacío lo decide models/feedEmptyState; acá solo
  // se resuelve qué hace el botón que ofrece.
  const empty = getFeedEmptyState({ scope, isFriendsBlocked, followingCount, isAuthenticated });

  const handleEmptyAction = () => {
    if (empty.action.kind === 'signup') openSignup();
    else if (empty.action.kind === 'suggestions') scrollToSection(SUGGESTIONS_SECTION_ID);
    else navigate('/music');
  };

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
        emptyAction={
          <Button variant={empty.action.variant} onClick={handleEmptyAction}>
            {empty.action.label}
          </Button>
        }
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
