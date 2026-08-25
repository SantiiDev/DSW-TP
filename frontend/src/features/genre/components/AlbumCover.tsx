// Carátula de un álbum, con reserva por si no hay imagen.
//
// La portada sale de `url_cover`, que cargó el seed. Cuando el álbum no tiene
// ninguna (los que dé de alta un usuario desde el CRUD de álbum) o cuando la
// imagen no carga, se dibuja un degradado con la inicial del título en vez de
// dejar el ícono de imagen rota del navegador.
import { useState } from 'react';
import '../styles/_genre.scss';

// Misma paleta que las tarjetas de género, para que las dos pantallas se vean
// de la misma familia. Es decoración, no un dato del negocio.
const GRADIENTS = [
  'linear-gradient(135deg, #e94560, #0f3460)',
  'linear-gradient(135deg, #f5a623, #e94560)',
  'linear-gradient(135deg, #48dbfb, #0abde3)',
  'linear-gradient(135deg, #c06c84, #6c5b7b)',
  'linear-gradient(135deg, #00cec9, #6c5ce7)',
  'linear-gradient(135deg, #fdcb6e, #e17055)',
  'linear-gradient(135deg, #2d3436, #636e72)',
  'linear-gradient(135deg, #a29bfe, #fd79a8)',
];

type AlbumCoverProps = {
  title: string;
  /** URL de la portada, o null si el álbum no tiene ninguna cargada. */
  url: string | null;
  /** 'sm' para la vista de lista, 'lg' para la de grilla. */
  size: 'sm' | 'lg';
};

/**
 * Elige el degradado de reserva a partir del título.
 *
 * Se suman los códigos de sus letras para que un mismo álbum caiga siempre en el
 * mismo color: si fuera al azar, cambiaría de color en cada render.
 *
 * @param title título del álbum.
 */
function pickGradient(title: string): string {
  const sum = [...title].reduce((total, char) => total + char.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

export const AlbumCover = ({ title, url, size }: AlbumCoverProps) => {
  // Se activa si la imagen no llega a cargar (URL caída, sin internet): a partir
  // de ahí se dibuja la reserva.
  const [hasFailed, setHasFailed] = useState(false);

  const className = `album-cover album-cover--${size}`;

  if (!url || hasFailed) {
    return (
      <div
        className={`${className} album-cover--fallback`}
        style={{ background: pickGradient(title) }}
        // La carátula es decorativa: el título va al lado en texto, así que un
        // lector de pantalla no necesita leer nada acá.
        aria-hidden="true"
      >
        <span className="album-cover__initial">{title.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={url}
      alt={`Portada de ${title}`}
      loading="lazy"
      onError={() => setHasFailed(true)}
    />
  );
};
