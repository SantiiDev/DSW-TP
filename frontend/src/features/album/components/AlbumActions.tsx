// Panel de acciones de la ficha de un álbum: la columna de botones que va arriba
// de todo en la barra lateral.
//
// Junta en un solo lugar lo que se puede hacer con el disco (calificarlo,
// compartirlo, seguir explorando por su género o por su artista), en vez de
// dejar cada acción desperdigada por la página.
//
// Calificar no abre el formulario desde acá: lleva a la sección de reseñas, que
// es la dueña del alta y de la edición (ver ReviewsSection).
import { useEffect, useState } from 'react';
import { Link2, Share2, Star } from 'lucide-react';
import { Button, ButtonLink } from '../../../core/components/Button';
import { scrollToSection } from '../../../core/utils/scrollToSection';
import type { Album } from '../models/Album';
import '../styles/_album.scss';

type AlbumActionsProps = {
  album: Album;
  /** Lo que puntuó el usuario, o null si todavía no reseñó este álbum. */
  myRating: number | null;
  onRate: () => void;
  /** Si la ficha tiene la sección de discografía a la que llevar. */
  showDiscography: boolean;
};

/** Cuánto queda visible el aviso de "enlace copiado", en milisegundos. */
const COPIED_NOTICE_MS = 2500;

export const AlbumActions = ({
  album,
  myRating,
  onRate,
  showDiscography,
}: AlbumActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // El aviso se borra solo a los pocos segundos. Va en un efecto y no en un
  // setTimeout suelto para poder cancelarlo si el usuario se va de la pantalla
  // antes de que termine.
  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), COPIED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  /** Copia al portapapeles la dirección de esta ficha, para poder compartirla. */
  const handleCopyLink = async () => {
    setCopyError(false);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // El portapapeles no está disponible en todos lados (por ejemplo si la
      // página no se sirve por HTTPS): se avisa en vez de no hacer nada.
      setCopyError(true);
    }
  };

  const mainGenre = album.genres[0] ?? null;

  return (
    <section className="album-actions">
      <Button variant="primary" fullWidth onClick={onRate}>
        <Star size={16} aria-hidden="true" />
        {myRating === null ? 'Escribir reseña' : 'Editar mi reseña'}
      </Button>

      {showDiscography && (
        <Button variant="outline" fullWidth onClick={() => scrollToSection('discografia')}>
          Más del artista
        </Button>
      )}

      {mainGenre && (
        <ButtonLink to={`/genres/${mainGenre.id}`} variant="outline" fullWidth>
          Explorar {mainGenre.name}
        </ButtonLink>
      )}

      <Button variant="subtle" fullWidth onClick={handleCopyLink}>
        <Share2 size={16} aria-hidden="true" />
        Compartir enlace
      </Button>

      {/* El aviso ocupa siempre el mismo lugar, así el panel no se mueve cuando
          aparece. */}
      {(copied || copyError) && (
        <p className={`album-actions__notice ${copyError ? 'album-actions__notice--error' : ''}`}>
          <Link2 size={14} aria-hidden="true" />
          {copyError ? 'No pudimos copiar el enlace.' : '¡Enlace copiado!'}
        </p>
      )}
    </section>
  );
};
