// Columna de acciones de la página de una reseña: reaccionar, ir a calificar el
// ítem, compartir el enlace y, según quién mire, gestionarla.
//
// No llama a la API por su cuenta: avisa hacia arriba y la página resuelve. La
// única excepción es copiar el enlace, que no toca el backend.
//
// Las acciones son filas de una misma tarjeta, separadas por una línea, y no los
// botones sueltos de core/components: son muchas y siempre las mismas, y como
// botones apilados la columna quedaba una pila de cápsulas. El botón compartido
// se sigue usando en todo el resto del sitio; esto es el formato propio de este
// panel, igual que .album-actions tiene el suyo en la ficha del álbum.
import { useState } from 'react';
import { Check, Eye, EyeOff, Heart, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import { GatedLink } from '../../../core/components/GatedLink';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type ReviewActionsPanelProps = {
  review: Review;
  /** Usuario logueado, o null si el enlace lo abrió un visitante. */
  currentUserId: number | null;
  isAdmin: boolean;
  onToggleLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Ocultar o restaurar, según en qué estado esté. Solo lo usa un ADMIN. */
  onToggleVisibility: () => void;
};

/** Cuánto dura el "¡Copiado!" del botón de compartir, en milisegundos. */
const COPIED_FEEDBACK_MS = 2000;

export const ReviewActionsPanel = ({
  review,
  currentUserId,
  isAdmin,
  onToggleLike,
  onEdit,
  onDelete,
  onToggleVisibility,
}: ReviewActionsPanelProps) => {
  const { openSignup } = useAuthModal();
  const [copied, setCopied] = useState(false);

  const isLogged = currentUserId !== null;
  const canEdit = review.canBeEditedBy(currentUserId);
  const canDelete = review.canBeDeletedBy(currentUserId, isAdmin);

  const itemLabel = review.targetKind === 'album' ? 'este álbum' : 'esta canción';

  const handleShare = async () => {
    // El origen actual y no un dominio fijo, así el enlace sirve igual en
    // desarrollo y en producción (mismo criterio que ReviewCard).
    const url = `${window.location.origin}${review.sharePath}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Si el navegador bloquea el portapapeles (pasa sin HTTPS) no se rompe
      // nada: la URL de esta página es exactamente la que se quería copiar.
      setCopied(false);
    }
  };

  return (
    <aside className="review-actions">
      {/* Sin sesión el corazón no se esconde ni se deshabilita: invita a
          registrarse, que es a lo que viene un enlace compartido. */}
      <button
        type="button"
        className={`review-actions__row${review.likedByMe ? ' review-actions__row--active' : ''}`}
        aria-pressed={review.likedByMe}
        onClick={isLogged ? onToggleLike : openSignup}
      >
        <Heart size={16} aria-hidden="true" fill={review.likedByMe ? 'currentColor' : 'none'} />
        {review.likedByMe ? 'Te gusta' : 'Me gusta'}
      </button>

      {/* El conteo es una fila más y no un botón: es un dato, no una acción. */}
      <p className="review-actions__row review-actions__row--count">
        {review.likesCount === 1 ? '1 me gusta' : `${review.likesCount} me gusta`}
      </p>

      {/* Lleva a la ficha del ítem, que es donde vive el formulario de
          calificación. Con GatedLink, a quien no tiene cuenta le abre el
          registro en vez de mandarlo a una ruta privada. */}
      <GatedLink to={review.targetLink} className="review-actions__row">
        <Star size={16} aria-hidden="true" />
        Calificar {itemLabel}
      </GatedLink>

      <button type="button" className="review-actions__row" onClick={handleShare}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
        {copied ? '¡Enlace copiado!' : 'Compartir reseña'}
      </button>

      {(canEdit || canDelete || isAdmin) && (
        <>
          <p className="review-actions__title">Gestión</p>

          {canEdit && (
            <button type="button" className="review-actions__row" onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" />
              Editar
            </button>
          )}

          {/* Ocultar saca la reseña del listado público y del promedio del
              álbum, pero no la borra: es reversible. */}
          {isAdmin && (
            <button type="button" className="review-actions__row" onClick={onToggleVisibility}>
              {review.isHidden ? (
                <>
                  <Eye size={16} aria-hidden="true" />
                  Restaurar
                </>
              ) : (
                <>
                  <EyeOff size={16} aria-hidden="true" />
                  Ocultar
                </>
              )}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="review-actions__row review-actions__row--danger"
              onClick={onDelete}
            >
              <Trash2 size={16} aria-hidden="true" />
              Eliminar
            </button>
          )}
        </>
      )}
    </aside>
  );
};
