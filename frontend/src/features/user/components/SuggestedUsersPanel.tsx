// Panel "Gente para seguir" de la página /reviews.
//
// Reemplaza al viejo PopularReviewers, que dibujaba catorce usuarios inventados
// dentro del propio componente. Ahora la lista sale de GET /api/users/suggestions,
// ordenada por cantidad de reseñas publicadas: recomendar a alguien que nunca
// escribió una reseña dejaría el feed de amigos igual de vacío.
//
// Es la otra mitad del CUU: sin una forma de encontrar gente, la solapa "Amigos"
// no se puede llenar nunca.
//
// Se ve con y sin sesión. Sin sesión el botón "Seguir" abre el modal de registro,
// que es justamente el gancho de la vitrina.
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar } from '../../../core/components/Avatar';
import { Badge } from '../../../core/components/Badge';
import { Loader } from '../../../core/components/Loader';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { useGatedNavigation } from '../../../core/hooks/useGatedNavigation';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { Link } from 'react-router-dom';
import { followService } from '../services/followService';
import { SuggestedUser } from '../models/Follow';
import { ROLE_LABELS, ROLE_TONES } from '../models/User';
import type { UserRole } from '../models/User';
import { FollowButton } from './FollowButton';
import '../styles/_suggested-users.scss';

type SuggestedUsersPanelProps = {
  /**
   * Avisa que se siguió o se dejó de seguir a alguien. Lo usa la página para
   * recargar el feed de amigos en el acto, sin que haga falta refrescar.
   */
  onFollowChange?: () => void;
};

export const SuggestedUsersPanel = ({ onFollowChange }: SuggestedUsersPanelProps) => {
  const { isAuthenticated } = useGatedNavigation();
  const { openSignup } = useAuthModal();

  // useFetch alcanza y sobra: el panel no pagina, así que reemplazar los datos en
  // cada carga es exactamente lo que hace falta (a diferencia del feed, que
  // acumula tandas y por eso no lo usa).
  const { data, isLoading, error, setData, setError } = useFetch(() =>
    followService.suggestions()
  );
  const users = data ?? [];

  // Id de la tarjeta con una operación en curso: deshabilita solo su botón.
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  /**
   * Sigue o deja de seguir al usuario de una tarjeta.
   *
   * La tarjeta se actualiza en el lugar en vez de recargar la lista: la API deja
   * de sugerir a quien ya seguís, así que recargar haría desaparecer de golpe la
   * tarjeta que se acaba de apretar, antes de que se vea que el botón hizo algo.
   */
  const handleToggleFollow = async (user: SuggestedUser) => {
    if (!isAuthenticated) {
      openSignup();
      return;
    }

    setBusyUserId(user.id);
    setError(null);

    try {
      if (user.followedByMe) {
        await followService.unfollow(user.id);
      } else {
        await followService.follow(user.id);
      }

      setData((current) =>
        (current ?? []).map((item) =>
          item.id === user.id ? item.withFollowedByMe(!user.followedByMe) : item
        )
      );

      onFollowChange?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="suggested-users">
      <SectionHeader icon={<Star size={20} />} title="Gente para seguir" />

      {isLoading ? (
        <Loader message="Buscando gente..." />
      ) : error ? (
        <p className="suggested-users__message suggested-users__message--error">{error}</p>
      ) : users.length === 0 ? (
        <p className="suggested-users__message">
          Por ahora no hay nadie más para seguir. Cuando se sumen más miembros van a aparecer acá.
        </p>
      ) : (
        <ul className="suggested-users__list">
          {users.map((user) => (
            <li key={user.id} className="suggested-user">
              <Link to={user.profilePath} className="suggested-user__identity">
                <Avatar url={user.avatarUrl} username={user.username} size="md" />

                <span className="suggested-user__info">
                  <span className="suggested-user__username">
                    {user.username}
                    {/* El rol FREE no lleva pastilla: es el estado normal y
                        marcarlo en cada tarjeta sería ruido. */}
                    {user.rol !== 'FREE' && (
                      <Badge tone={ROLE_TONES[user.rol as UserRole]}>
                        {ROLE_LABELS[user.rol as UserRole]}
                      </Badge>
                    )}
                  </span>
                  <span className="suggested-user__meta">{user.reviewsLabel}</span>
                </span>
              </Link>

              <FollowButton
                isFollowing={user.followedByMe}
                isBusy={busyUserId === user.id}
                size="sm"
                onToggle={() => handleToggleFollow(user)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
