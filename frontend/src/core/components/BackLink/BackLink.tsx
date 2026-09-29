// Botón "Volver" que devuelve al lugar del que se vino.
//
// Reemplaza a los enlaces fijos del tipo "Volver a explorar música" o "Volver a
// <álbum>": a una ficha de canción se puede llegar desde el tracklist de su
// álbum, desde el explorador, desde el listado de una década o desde los aportes
// del perfil, y mandar siempre al mismo lado estaba mal en casi todos los casos.
//
//   <BackLink fallbackTo="/music" />
//
// Si no hay a dónde volver (se entró pegando la URL en el navegador, o es la
// primera página de la sesión), navega a `fallbackTo`, que es la pantalla que
// tiene sentido para esa ficha.
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './_back-link.scss';

type BackLinkProps = {
  /** A dónde ir cuando no hay historial previo dentro de la app. */
  fallbackTo: string;
  /** Texto del botón. Por defecto, "Volver". */
  label?: string;
};

/**
 * ¿Hay una página anterior DENTRO de la app a la que volver?
 *
 * React Router numera las entradas de su historial en `history.state.idx`: la
 * primera es la 0. Se mira eso y no `history.length`, que cuenta también las
 * páginas de otros sitios por las que pasó la pestaña: con esa, un `volver`
 * podría sacar al usuario de Musicboxd.
 */
function canGoBack(): boolean {
  const state = window.history.state as { idx?: number } | null;
  return (state?.idx ?? 0) > 0;
}

export const BackLink = ({ fallbackTo, label = 'Volver' }: BackLinkProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (canGoBack()) navigate(-1);
    else navigate(fallbackTo);
  };

  return (
    <button type="button" className="back-link" onClick={handleClick}>
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
};
