// Página de una reseña (/reviews/:id): el detalle del listado de reseñas.
//
// Es la ruta a la que llevan el botón "Compartir" y el "Leer más..." de cada
// tarjeta, y es PÚBLICA a propósito: un enlace compartido lo tiene que poder
// abrir alguien sin cuenta, igual que la vitrina /music. La API del detalle
// también es pública (ver optionalAuth en review.routes.ts).
//
// Muestra tres cosas que el listado no puede: el texto completo sin cortar, el
// hilo de comentarios ya desplegado y las otras reseñas del mismo autor y del
// mismo ítem. Y es también la pantalla donde el autor gestiona la suya.
//
// El layout es de dos columnas desde LG, como la ficha de álbum: a la izquierda
// lo que se lee de corrido y a la derecha las acciones, que quedan a la vista sin
// tener que volver a subir después de leer una reseña larga.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquareOff } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Avatar } from '../../../core/components/Avatar';
import { BackLink } from '../../../core/components/BackLink';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { GatedLink } from '../../../core/components/GatedLink';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { Navbar } from '../../../core/components/Navbar';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { RelatedReviews } from '../components/RelatedReviews';
import { ReviewActionsPanel } from '../components/ReviewActionsPanel';
import { ReviewComments } from '../components/ReviewComments';
import { ReviewEditModal } from '../components/ReviewEditModal';
import { StarRating } from '../components/StarRating';
import { reviewService } from '../services/reviewService';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

export const ReviewDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();

  const currentUser = authState.user;
  const isLogged = currentUser !== null;

  const {
    data: review,
    isLoading,
    error,
    setData,
    setError,
  } = useFetch(() => reviewService.getById(Number(id)), id);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /**
   * Guarda la reseña que devolvió la API sin volver a pedirla. Todas las
   * operaciones de esta pantalla la devuelven ya actualizada, así que recargar
   * sería una request al pedo y encima haría parpadear la página.
   */
  const handleUpdated = (updated: Review) => {
    setData(updated);
  };

  const handleToggleLike = async () => {
    if (!review) return;

    try {
      handleUpdated(await reviewService.toggleLike(review.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleVisibility = async () => {
    if (!review) return;

    try {
      handleUpdated(
        review.isHidden
          ? await reviewService.restore(review.id)
          : await reviewService.hide(review.id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!review) return;

    setIsDeleteOpen(false);

    try {
      await reviewService.remove(review.id);
      // La reseña ya no existe, así que esta página tampoco: se vuelve a la ficha
      // del ítem, que es de donde salió y donde se puede escribir otra.
      navigate(review.targetLink);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="review-detail__state">
          <Loader message="Cargando la reseña..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="review-detail__state">
          <Alert tone="error">{error}</Alert>
        </div>
      );
    }

    if (!review) {
      return (
        <div className="review-detail__state">
          <EmptyState
            icon={<MessageSquareOff size={22} aria-hidden="true" />}
            title="No encontramos esa reseña."
            message="Puede que su autor la haya borrado, o que el enlace esté mal."
          />
        </div>
      );
    }

    return (
      <>
        {/* Cabecera del ítem reseñado: es la respuesta a "¿de qué es esta
            reseña?", que es lo primero que se pregunta quien abre un enlace
            compartido. Con GatedLink, sin cuenta lleva al registro en vez de a
            una ruta privada. */}
        <header className="review-detail__hero">
          {/* La portada, repetida de fondo, difuminada y oscurecida. Es la única
              imagen que tenemos del ítem, y da el color del disco a la cabecera
              sin pedirle nada nuevo a la API. Decorativa: el mismo dato ya se ve
              en la carátula de al lado. */}
          {review.coverUrl && (
            <div
              className="review-detail__backdrop"
              style={{ backgroundImage: `url(${review.coverUrl})` }}
              aria-hidden="true"
            />
          )}

          <div className="review-detail__hero-content">
            {/* La carátula va dentro de una caja de ancho fijo: el componente
                compartido dibuja su versión grande al 100% del contenedor,
                porque está pensado para una celda de grilla. */}
            <GatedLink to={review.targetLink} className="review-detail__cover">
              <AlbumCover title={review.targetTitle} url={review.coverUrl} size="lg" />
            </GatedLink>

            <div className="review-detail__item-info">
              <GatedLink to={review.targetLink} className="review-detail__item-link">
                <h1 className="review-detail__item-title">{review.targetTitle}</h1>
              </GatedLink>

              <p className="review-detail__item-meta">
                {review.targetKind === 'album' ? (
                  <span>Álbum</span>
                ) : (
                  <>
                    <span>Canción</span>
                    <span>Pista {review.song?.numberTrack}</span>
                  </>
                )}
              </p>

              <p className="review-detail__item-subtitle">{review.targetSubtitle}</p>
            </div>
          </div>
        </header>

        <div className="review-detail__body">
          <div className="review-detail__main">
            <article className="review-detail__review">
              <header className="review-detail__author">
                {/* El avatar y el nombre llevan al perfil de quien la escribió,
                    salvo que la reseña haya quedado sin autor: ahí no hay perfil
                    al que ir, así que van como texto suelto. */}
                {review.author ? (
                  <Link to={`/users/${review.author.id}`} className="review-detail__avatar">
                    <Avatar url={review.author.avatarUrl} username={review.authorName} size="lg" />
                  </Link>
                ) : (
                  <span className="review-detail__avatar">
                    <Avatar url={null} username={review.authorName} size="lg" />
                  </span>
                )}

                {/* La calificación va debajo del nombre y no al costado: es lo
                    primero que se lee de una reseña, junto con quién la firma. */}
                <div className="review-detail__author-meta">
                  <p className="review-detail__author-name">
                    Reseña de{' '}
                    {review.author ? (
                      <Link to={`/users/${review.author.id}`}>{review.authorName}</Link>
                    ) : (
                      <strong>{review.authorName}</strong>
                    )}
                    {/* La pastilla solo la ven el autor y un ADMIN: para el resto
                        una reseña oculta devuelve 404. */}
                    {review.isHidden && <Badge tone="warning">Oculta</Badge>}
                  </p>

                  <StarRating value={review.rating} size={24} />

                  <p className="review-detail__date">
                    Publicada el {review.dateLabel}
                    {review.isEdited && (
                      <span title={`Editada el ${review.editedLabel}`}> · Editado</span>
                    )}
                  </p>
                </div>
              </header>

              {/* Acá el texto va entero: para eso se entra a la página. */}
              {review.hasText ? (
                <p className="review-detail__text">{review.text}</p>
              ) : (
                <p className="review-detail__text review-detail__text--empty">
                  {review.authorName} calificó sin escribir una reseña.
                </p>
              )}
            </article>

            <section className="review-detail__comments">
              <h2 className="review-detail__section-title">Comentarios</h2>

              {/* Ya trae la lista, la caja de texto y el borrado con
                  confirmación, y esconde el formulario si no hay sesión. */}
              <ReviewComments
                reviewId={review.id}
                currentUserId={currentUser?.id ?? null}
                isAdmin={currentUser?.isAdmin ?? false}
                // En una página entera el hilo se muestra grande: el campo de
                // texto ocupa el ancho y el botón va debajo, en vez de la fila
                // apretada que entra dentro de una tarjeta del listado.
                variant="page"
                // El contador vive en la reseña, que en esta pantalla se recarga
                // sola con cada operación: acá no hay ninguno que actualizar.
                onCountChange={() => {}}
              />
            </section>
          </div>

          <div className="review-detail__aside">
            <ReviewActionsPanel
              review={review}
              currentUserId={currentUser?.id ?? null}
              isAdmin={currentUser?.isAdmin ?? false}
              onToggleLike={handleToggleLike}
              onEdit={() => setIsFormOpen(true)}
              onDelete={() => setIsDeleteOpen(true)}
              onToggleVisibility={handleToggleVisibility}
            />

            {/* El listado de reseñas exige token, así que sin sesión estos dos
                bloques darían 401. En su lugar va la invitación a registrarse,
                que es lo que corresponde en una pantalla pública. */}
            {isLogged ? (
              <>
                {review.author && (
                  <RelatedReviews
                    title={`Más reseñas de ${review.authorName}`}
                    filters={{ userId: review.author.id }}
                    fetchKey={`author-${review.author.id}`}
                    excludeId={review.id}
                  />
                )}

                <RelatedReviews
                  title={
                    review.targetKind === 'album'
                      ? 'Más reseñas de este álbum'
                      : 'Más reseñas de esta canción'
                  }
                  filters={{ target: { kind: review.targetKind, id: review.targetId } }}
                  fetchKey={`target-${review.targetKind}-${review.targetId}`}
                  excludeId={review.id}
                />
              </>
            ) : (
              <section className="review-detail__signup">
                <p className="review-detail__signup-text">
                  Creá tu cuenta para ver más reseñas de la comunidad, comentar y calificar
                  tu propia música.
                </p>
                <Button variant="primary" fullWidth onClick={openSignup}>
                  Unirme a Musicboxd
                </Button>
              </section>
            )}
          </div>
        </div>

        <ReviewEditModal
          isOpen={isFormOpen}
          review={review}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleUpdated}
        />

        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Eliminar la reseña"
          message="La reseña se borra definitivamente y el promedio se recalcula sin ella. Después vas a poder escribir una nueva."
          confirmLabel="Eliminar"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </>
    );
  };

  return (
    <>
      <Navbar />

      {/* La cabecera va a lo ancho de la pantalla, así que el contenedor que
          alinea el contenido con el navbar no envuelve toda la página: lo aplica
          cada bloque por su cuenta (ver page-container en los estilos). */}
      <main className="review-detail">
        <div className="review-detail__topbar">
          {/* Vuelve al lugar del que se vino. El fallback es /music porque a esta
              página se puede llegar desde un enlace pegado, sin historial. */}
          <BackLink fallbackTo="/music" />
        </div>

        {renderContent()}
      </main>

      <Footer />
    </>
  );
};
