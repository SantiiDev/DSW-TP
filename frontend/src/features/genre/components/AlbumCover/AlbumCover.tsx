// Carátula de un álbum, con reserva por si no hay imagen.
//
// La portada sale de `url_cover`, que cargó el seed. Cuando el álbum no tiene
// ninguna (los que dé de alta un usuario desde el CRUD de álbum) o cuando la
// imagen no carga, se dibuja un degradado con la inicial del título en vez de
// dejar el ícono de imagen rota del navegador.
import { useState } from 'react';
import './AlbumCover.scss';

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
 * Lado en píxeles de la imagen que se le pide a Deezer según el tamaño de la
 * portada. Es el doble de lo que ocupa en pantalla, para que se vea nítida en
 * celulares y pantallas de alta densidad.
 */
const COVER_PIXELS: Record<AlbumCoverProps['size'], number> = { sm: 120, lg: 500 };

/**
 * Pide la portada al tamaño en que se va a mostrar.
 *
 * El seed guardó las portadas de Deezer en 1000x1000 (unos 150 KB cada una), y
 * /music muestra treinta a la vez: más de 4 MB de imágenes para dibujarlas a
 * 170px. El CDN de Deezer sirve la misma imagen en cualquier tamaño cambiando
 * ese tramo de la URL, y a 500x500 pesa un tercio (a 120x120, la trigésima parte).
 *
 * Las URLs que no tienen ese formato (las que carga un usuario) se devuelven
 * tal cual.
 *
 * @param url URL guardada en la base.
 * @param pixels lado de la imagen a pedir.
 * @returns la URL con el tamaño pedido.
 */
function sizedCoverUrl(url: string, pixels: number): string {
  return url.replace(/\/\d+x\d+-(\w+-\d+-\d+-\d+\.jpg)$/, `/${pixels}x${pixels}-$1`);
}

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
      src={sizedCoverUrl(url, COVER_PIXELS[size])}
      alt={`Portada de ${title}`}
      loading="lazy"
      onError={() => setHasFailed(true)}
    />
  );
};
