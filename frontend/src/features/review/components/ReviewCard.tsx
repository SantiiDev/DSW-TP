// Una reseña de la comunidad: quién la escribió, qué le puso, qué dijo, y las
// tres formas de reaccionar (me gusta, comentar y compartir).
//
// La reseña en sí es un enlace a su página (/reviews/:id), donde se lee entera
// con su hilo de comentarios. La franja de abajo queda afuera de ese enlace
// porque son botones, y un botón adentro de un enlace no es HTML válido.
//
// Los botones de gestión (editar, ocultar, eliminar) salen según quién esté
// mirando: el autor ve editar y borrar, un ADMIN ve ocultar y borrar. Es solo para
// no mostrar botones que van a fallar; quien corta de verdad es la API.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, EyeOff, Heart, MessageCircle, Pencil, Share2, Trash2 } from 'lucide-react';
import { Avatar } from '../../../core/components/Avatar';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { StarRating } from './StarRating';
import { ReviewComments } from './ReviewComments';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type ReviewCardProps = {
  review: Review;
  /**
   * true en la ficha del álbum o de la canción: ahí ya se sabe de qué ítem son
   * todas las reseñas y repetirlo en cada tarjeta es ruido. En el listado del
   * perfil, en cambio, hace falta.
   */
  hideTarget?: boolean;
  /** Usuario logueado, o null si la sección se está mirando sin sesión. */
  currentUserId: number | null;
  isAdmin: boolean;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
  /** Ocultar o restaurar, según en qué estado esté. Solo lo usa un ADMIN. */
  onToggleVisibility: (review: Review) => void;
  /** Pone o saca el "me gusta". La tarjeta no llama sola a la API. */
  onToggleLike: (review: Review) => void;
};

/** Cuánto dura el "¡Copiado!" del botón de compartir, en milisegundos. */
const COPIED_FEEDBACK_MS = 2000;

export const ReviewCard = ({
  review,
  hideTarget = false,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleLike,
}: ReviewCardProps) => {
  // Si el hilo de comentarios está abierto.
  const [showComments, setShowComments] = useState(false);
  // Contador local: cambia al comentar o borrar sin volver a pedir la reseña.
  const [commentsCount, setCommentsCount] = useState(review.commentsCount);
  const [copied, setCopied] = useState(false);

  const canEdit = review.canBeEditedBy(currentUserId);
  const canDelete = review.canBeDeletedBy(currentUserId, isAdmin);
  const isLogged = currentUserId !== null;

  const handleShare = async () => {
    // La URL se arma con el origen actual para que sirva igual en desarrollo y en
    // producción, sin hardcodear el dominio (mismo criterio que ProfileSidebar).
    // Apunta a la página de la reseña, que es pública: quien la reciba la puede
    // abrir aunque no tenga cuenta.
    const url = `${window.location.origin}${review.sharePath}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Si el navegador bloquea el portapapeles (pasa sin HTTPS) no se rompe nada:
      // el usuario todavía puede copiar la URL de la barra de direcciones.
      setCopied(false);
    }
  };

  return (
    <article className={`review-card${review.isHidden ? ' review-card--hidden' : ''}`}>
      {/* Toda la reseña es un enlace a su página, como en cualquier muro: se
          aprieta en cualquier lado y se abre entera, con sus comentarios.

          El enlace envuelve solo esta parte y no la tarjeta completa a
          propósito: abajo hay botones, y un <button> adentro de un <a> es HTML
          inválido (y el click terminaría navegando en vez de dar "me gusta").
          Por lo mismo el ítem reseñado dejó de ser un enlace aparte: se llega a
          su ficha desde la página de la reseña. */}
      <Link to={review.sharePath} className="review-card__link">
        <header className="review-card__header">
          <Avatar url={review.author?.avatarUrl ?? null} username={review.authorName} size="md" />

          <div className="review-card__meta">
            <p className="review-card__author">
              {review.authorName}
              {/* La pastilla solo la ven el autor y un ADMIN: para el resto, una
                  reseña oculta directamente no aparece en el listado. */}
              {review.isHidden && <Badge tone="warning">Oculta</Badge>}
            </p>
            <p className="review-card__date">
              {review.dateLabel}
              {/* Aviso de que lo que se está leyendo no es exactamente lo que se
                  publicó. El title da la fecha exacta sin sumar texto a la UI. */}
              {review.isEdited && (
                <span className="review-card__edited" title={`Editada el ${review.editedLabel}`}>
                  · Editado
                </span>
              )}
            </p>
          </div>

          <StarRating value={review.rating} size={16} showValue />
        </header>

        {/* En el listado del perfil hace falta decir qué se reseñó. En la ficha
            del ítem, no: ahí ya se sabe. */}
        {!hideTarget && (
          <span className="review-card__target">
            <span className="review-card__target-title">{review.targetTitle}</span>
            <span className="review-card__target-subtitle">{review.targetSubtitle}</span>
          </span>
        )}

        {review.hasText ? (
          <>
            <p className="review-card__text">{review.excerpt}</p>

            {/* Pista de que hay más para leer. Es un <span> y no un enlace
                aparte porque toda la tarjeta ya lleva al mismo lado. */}
            {review.isLong && <span className="review-card__read-more">Leer más...</span>}
          </>
        ) : (
          // Una calificación sin texto es válida y es lo más común: se dice, en
          // vez de dejar un hueco que parezca un error de carga.
          <p className="review-card__text review-card__text--empty">
            Calificó sin escribir una reseña.
          </p>
        )}
      </Link>

      <footer className="review-card__footer">
        <div className="review-card__reactions">
          {/* Me gusta. Sin sesión el botón queda deshabilitado en vez de
              esconderse: el contador se sigue viendo, que es un dato público. */}
          <button
            type="button"
            className={`review-card__reaction${review.likedByMe ? ' review-card__reaction--active' : ''}`}
            disabled={!isLogged}
            aria-pressed={review.likedByMe}
            aria-label={review.likedByMe ? 'Quitar me gusta' : 'Me gusta'}
            title={isLogged ? 'Me gusta' : 'Iniciá sesión para reaccionar'}
            onClick={() => onToggleLike(review)}
          >
            <Heart
              size={16}
              aria-hidden="true"
              // Relleno solo cuando ya lo diste: es la señal de que el corazón
              // está activo, igual que en cualquier red social.
              fill={review.likedByMe ? 'currentColor' : 'none'}
            />
            <span>{review.likesCount}</span>
          </button>

          <button
            type="button"
            className={`review-card__reaction${showComments ? ' review-card__reaction--active' : ''}`}
            aria-expanded={showComments}
            aria-label="Ver comentarios"
            title="Comentarios"
            onClick={() => setShowComments((current) => !current)}
          >
            <MessageCircle size={16} aria-hidden="true" />
            <span>{commentsCount}</span>
          </button>

          <button
            type="button"
            className="review-card__reaction"
            aria-label="Copiar el enlace de la reseña"
            title="Compartir"
            onClick={handleShare}
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
            <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
          </button>
        </div>

        {(canEdit || canDelete || isAdmin) && (
          <div className="review-card__actions">
            {canEdit && (
              <Button variant="subtle" size="sm" onClick={() => onEdit(review)}>
                <Pencil size={14} aria-hidden="true" />
                Editar
              </Button>
            )}

            {/* Moderación: ocultar saca la reseña del listado público y del
                promedio del álbum, pero no la borra. Es reversible. */}
            {isAdmin && (
              <Button variant="subtle" size="sm" onClick={() => onToggleVisibility(review)}>
                {review.isHidden ? (
                  <>
                    <Eye size={14} aria-hidden="true" />
                    Restaurar
                  </>
                ) : (
                  <>
                    <EyeOff size={14} aria-hidden="true" />
                    Ocultar
                  </>
                )}
              </Button>
            )}

            {canDelete && (
              <Button variant="danger" size="sm" onClick={() => onDelete(review)}>
                <Trash2 size={14} aria-hidden="true" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </footer>

      {showComments && (
        <ReviewComments
          reviewId={review.id}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onCountChange={setCommentsCount}
        />
      )}
    </article>
  );
};
