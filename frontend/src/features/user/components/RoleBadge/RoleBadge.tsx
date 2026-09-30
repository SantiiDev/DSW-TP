// Pastilla del rol que va al lado del nombre de un usuario, en todo lugar donde
// se lo muestra a otros: reseñas, comentarios, listas, filas de la comunidad, el
// perfil y la navbar. El badge Pro es uno de los beneficios de la membresía.
//
// Tiene diseño propio (acabado metálico con un brillo al pasar el mouse) y no usa
// el Badge de core, que es el de los estados ("Oculta", "Pendiente") y tiene que
// seguir siendo sobrio.
//
// El badge Pro toma el color de acento que el usuario eligió para su perfil: es
// el mismo color de su banner y de la franja de sus reseñas, así el usuario se
// reconoce por un solo color en todo el sitio. El de Admin no cambia: marca un
// rol del sistema, no una personalización.
//
// El rol FREE no lleva pastilla: es el estado normal y marcarlo en cada nombre
// sería ruido. Tampoco se dibuja nada sin rol (autor de una cuenta eliminada).
import { DEFAULT_PROFILE_COLOR, ROLE_LABELS } from '../../models/User';
import type { ProfileColor, UserRole } from '../../models/User';
import './RoleBadge.scss';

type RoleBadgeProps = {
  rol: UserRole | null;
  /** Color de acento del usuario. Sin color, el badge Pro sale en el verde del sitio. */
  accent?: ProfileColor | null;
};

export const RoleBadge = ({ rol, accent = null }: RoleBadgeProps) => {
  if (rol === null || rol === 'FREE') return null;

  const classes =
    rol === 'PRO'
      ? `role-badge role-badge--pro role-badge--accent-${accent ?? DEFAULT_PROFILE_COLOR}`
      : 'role-badge role-badge--admin';

  return <span className={classes}>{ROLE_LABELS[rol]}</span>;
};
