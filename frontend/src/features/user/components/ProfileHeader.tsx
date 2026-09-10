// Cabecera del perfil: avatar, nombre, rol, contadores y acciones.
// Es presentacional; quien decide qué hacer con los botones es UserProfilePage.
import { Avatar } from '../../../core/components/Avatar';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { ROLE_LABELS, ROLE_TONES } from '../models/User';
import type { User } from '../models/User';
import type { ProfileStats } from '../models/ProfileStats';
import { FollowButton } from './FollowButton';

type ProfileHeaderProps = {
  user: User;
  stats: ProfileStats;
  /** true si el perfil es el del usuario logueado: habilita editar y eliminar. */
  isOwnProfile: boolean;
  /** Si el usuario logueado sigue al dueño de este perfil. */
  isFollowing: boolean;
  /** Hay un seguir/dejar de seguir en curso: deshabilita el botón. */
  isFollowBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFollow: () => void;
};

// Los contadores se declaran como data y no como JSX repetido: son cuatro cajas
// idénticas que solo cambian número y etiqueta.
const STAT_LABELS: { key: keyof ProfileStats; label: string }[] = [
  { key: 'reviews', label: 'Reseñas' },
  { key: 'listened', label: 'Escuchados' },
  { key: 'following', label: 'Siguiendo' },
  { key: 'followers', label: 'Seguidores' },
];

export const ProfileHeader = ({
  user,
  stats,
  isOwnProfile,
  isFollowing,
  isFollowBusy,
  onEdit,
  onDelete,
  onToggleFollow,
}: ProfileHeaderProps) => {
  return (
    <header className="profile-header">
      <div className="profile-header__identity">
        <Avatar url={user.urlAvatar} username={user.username} size="lg" />

        <div className="profile-header__info">
          <h1 className="profile-header__username">{user.username}</h1>

          <div className="profile-header__meta">
            <Badge tone={ROLE_TONES[user.rol]}>{ROLE_LABELS[user.rol]}</Badge>
            <span className="profile-header__since">
              Miembro desde {user.registrationDate.toLocaleDateString('es-AR')}
            </span>
          </div>

          {/* El email es dato privado: la API solo lo manda en el perfil propio. */}
          {isOwnProfile && user.email && (
            <p className="profile-header__email">{user.email}</p>
          )}
        </div>
      </div>

      <div className="profile-header__side">
        <ul className="profile-header__stats">
          {STAT_LABELS.map(({ key, label }) => (
            <li key={key} className="profile-header__stat">
              <span className="profile-header__stat-value">{stats[key]}</span>
              <span className="profile-header__stat-label">{label}</span>
            </li>
          ))}
        </ul>

        {/* En el perfil propio van las acciones sobre la cuenta; en el de otro,
            el botón de seguirlo. Los dos casos comparten el mismo lugar y la
            misma caja, que es donde el usuario ya sabe que están las acciones. */}
        {isOwnProfile ? (
          <div className="profile-header__actions">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar perfil
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Dar de baja mi cuenta
            </Button>
          </div>
        ) : (
          <div className="profile-header__actions">
            <FollowButton
              isFollowing={isFollowing}
              isBusy={isFollowBusy}
              size="sm"
              onToggle={onToggleFollow}
            />
          </div>
        )}
      </div>
    </header>
  );
};
