// Fila de un resultado del buscador de la barra: una imagen, un título y una línea
// de detalle, como enlace a la ficha. La usan los álbumes y las canciones; los
// usuarios tienen su propia fila (features/user/components/UserRow), que además
// muestra el rol.
//
// Va con GatedLink porque las fichas piden sesión: sin cuenta, elegir un resultado
// abre el registro, igual que las tarjetas del explorador.
import type { ReactNode } from 'react';
import { GatedLink } from './GatedLink';

type SearchResultRowProps = {
  /** Ruta de la ficha. */
  to: string;
  /** Imagen de la izquierda (la portada del álbum). */
  cover: ReactNode;
  title: string;
  subtitle: string;
  /** Resaltada con el teclado. */
  isHighlighted: boolean;
  /** Aviso al elegirla, para que el buscador se cierre y se limpie. */
  onNavigate: () => void;
};

export const SearchResultRow = ({
  to,
  cover,
  title,
  subtitle,
  isHighlighted,
  onNavigate,
}: SearchResultRowProps) => {
  return (
    <GatedLink
      to={to}
      className={`search-result ${isHighlighted ? 'search-result--highlighted' : ''}`}
      onClick={onNavigate}
    >
      <span className="search-result__cover">{cover}</span>
      <span className="search-result__info">
        <span className="search-result__title">{title}</span>
        <span className="search-result__subtitle">{subtitle}</span>
      </span>
    </GatedLink>
  );
};
