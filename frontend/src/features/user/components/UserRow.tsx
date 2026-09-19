// Fila de un usuario de la comunidad: avatar, nombre, pastilla del rol, un dato
// debajo y, opcionalmente, el botón de seguir.
//
// Es la misma fila en el panel "Gente para seguir", en las listas de seguidores y
// seguidos del perfil y en los resultados del buscador. Antes vivía escrita
// adentro del panel; al sumarse las otras dos pantallas se sacó acá para no tener
// tres filas parecidas que se desincronizan.
//
// Es presentacional: no llama a la API. El nombre y el avatar llevan al perfil
// (sin sesión, abren el registro) y el botón queda afuera del enlace para que
// apretarlo no navegue.
import { Avatar } from '../../../core/components/Avatar';
import { Badge } from '../../../core/components/Badge';
import { GatedLink } from '../../../core/components/GatedLink';
import type { CommunityUser } from '../models/Follow';
import { ROLE_LABELS, ROLE_TONES } from '../models/User';
import { FollowButton } from './FollowButton';
import '../styles/_user-row.scss';

type UserRowProps = {
  user: CommunityUser;
  /** Texto chico debajo del nombre ("3 reseñas · 5 seguidores"). */
  meta: string;
  /** Muestra el botón de seguir. No va en la fila del propio usuario ni en el buscador. */
  showFollowButton?: boolean;
  /** Hay una operación de seguir en curso sobre esta fila. */
  isBusy?: boolean;
  onToggleFollow?: () => void;
  /** Aviso al elegir al usuario, para que un modal o un desplegable se cierre. */
  onNavigate?: () => void;
  /** Versión más apretada, para el desplegable del buscador. */
  compact?: boolean;
};

export const UserRow = ({
  user,
  meta,
  showFollowButton = false,
  isBusy = false,
  onToggleFollow,
  onNavigate,
  compact = false,
}: UserRowProps) => {
  return (
    <div className={compact ? 'user-row user-row--compact' : 'user-row'}>
      <GatedLink to={user.profilePath} className="user-row__identity" onClick={onNavigate}>
        <Avatar url={user.avatarUrl} username={user.username} size={compact ? 'sm' : 'md'} />

        <span className="user-row__info">
          <span className="user-row__username">
            <span className="user-row__name">{user.username}</span>
            {/* El rol FREE no lleva pastilla: es el estado normal y marcarlo en
                cada fila sería ruido. */}
            {user.rol !== 'FREE' && (
              <Badge tone={ROLE_TONES[user.rol]}>{ROLE_LABELS[user.rol]}</Badge>
            )}
          </span>
          <span className="user-row__meta">{meta}</span>
        </span>
      </GatedLink>

      {showFollowButton && onToggleFollow && (
        <FollowButton
          isFollowing={user.followedByMe}
          isBusy={isBusy}
          size="sm"
          onToggle={onToggleFollow}
        />
      )}
    </div>
  );
};
