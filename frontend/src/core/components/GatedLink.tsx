// Enlace que pide sesión antes de dejar entrar.
//
// Con sesión iniciada es un <Link> de React Router de verdad, así que se puede
// abrir en otra pestaña y el lector de pantalla lo anuncia como enlace. Sin
// sesión es un <button> que abre el modal de registro, porque no lleva a ningún
// lado y anunciarlo como enlace sería mentir.
//
// Lo usan las tarjetas del explorador de música, que muestran el catálogo real a
// cualquiera pero solo dejan entrar a quien tiene cuenta.
//
//   <GatedLink to={`/albums/${album.id}`} className="music-card">
//     ...
//   </GatedLink>
//
// La clase que se le pase se aplica igual en los dos casos: `gated-link` le saca
// al <button> los estilos propios del navegador para que se vea idéntico al
// <a> al que reemplaza.
import { Link } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import { useGatedNavigation } from '../hooks/useGatedNavigation';
import './_gated-link.scss';

type GatedLinkProps = {
  /** Ruta a la que navega cuando hay sesión. */
  to: string;
  className?: string;
  /**
   * Estilos en línea. Los usan las tarjetas de género, cuyo degradado se elige
   * por posición en el listado y no se puede escribir en una clase fija.
   */
  style?: CSSProperties;
  /** Nombre accesible, para cuando el contenido no alcanza para describirlo. */
  ariaLabel?: string;
  children: ReactNode;
};

export const GatedLink = ({
  to,
  className = '',
  style,
  ariaLabel,
  children,
}: GatedLinkProps) => {
  const { isAuthenticated, goOrSignup } = useGatedNavigation();

  const classes = ['gated-link', className].filter(Boolean).join(' ');

  if (isAuthenticated) {
    return (
      <Link to={to} className={classes} style={style} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-label={ariaLabel}
      onClick={() => goOrSignup(to)}
    >
      {children}
    </button>
  );
};
