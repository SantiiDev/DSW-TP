// Navegación entre pistas al pie de la ficha de una canción: la anterior a la
// izquierda y la siguiente a la derecha, como en un reproductor.
//
// Escuchar un disco es ir de una pista a la siguiente, y sin esto el único camino
// era volver al álbum y entrar de nuevo. En la primera y en la última pista sobra
// un lado, así que ese enlace simplemente no se dibuja.
//
// Es presentacional: recibe las dos canciones ya elegidas por la página.
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Song } from '../models/Song';
import '../styles/_song.scss';

type SongTrackNavProps = {
  /** Pista anterior del álbum, o null si esta es la primera. */
  previous: Song | null;
  /** Pista siguiente del álbum, o null si esta es la última. */
  next: Song | null;
};

export const SongTrackNav = ({ previous, next }: SongTrackNavProps) => {
  // Un álbum de una sola pista no tiene ni anterior ni siguiente: ahí el bloque
  // entero sobra.
  if (!previous && !next) return null;

  return (
    <nav className="track-nav" aria-label="Otras pistas del álbum">
      {previous && (
        <Link to={`/songs/${previous.id}`} className="track-nav__item track-nav__item--prev">
          <ChevronLeft size={20} aria-hidden="true" />

          <span className="track-nav__text">
            <span className="track-nav__label">Anterior</span>
            <span className="track-nav__name">{previous.title}</span>
          </span>
        </Link>
      )}

      {next && (
        <Link to={`/songs/${next.id}`} className="track-nav__item track-nav__item--next">
          <span className="track-nav__text">
            <span className="track-nav__label">Siguiente</span>
            <span className="track-nav__name">{next.title}</span>
          </span>

          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
};
