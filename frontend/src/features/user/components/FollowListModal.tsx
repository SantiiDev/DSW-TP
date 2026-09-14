// Ventana con las listas de seguidores y seguidos de un perfil.
//
// Se abre al tocar los contadores "Seguidores" o "Siguiendo" de la cabecera, con
// la solapa correspondiente elegida. Dentro se puede cambiar de solapa, cargar
// más gente de a tandas, seguir o dejar de seguir a cada persona y entrar a su
// perfil.
//
// La página la monta recién cuando se abre, así cada apertura arranca con el
// estado limpio y la solapa pedida, sin arrastrar la lista de la vez anterior.
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Button, ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import type { CommunityUser } from '../models/Follow';
import { followService } from '../services/followService';
import { UserRow } from './UserRow';
import '../styles/_follow-list.scss';

export type FollowListTab = 'followers' | 'following';

type FollowListModalProps = {
  userId: number;
  username: string;
  isOwnProfile: boolean;
  /** Solapa con la que se abre. */
  initialTab: FollowListTab;
  onClose: () => void;
  /** Avisa que se siguió o se dejó de seguir a alguien, para refrescar los contadores. */
  onFollowChange: () => void;
};

const TABS = [
  { value: 'followers', label: 'Seguidores' },
  { value: 'following', label: 'Siguiendo' },
] as const;

/** Cuántas personas trae cada tanda. */
const PAGE_SIZE = 20;

export const FollowListModal = ({
  userId,
  username,
  isOwnProfile,
  initialTab,
  onClose,
  onFollowChange,
}: FollowListModalProps) => {
  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();
  const currentUserId = authState.user?.id ?? null;

  const [tab, setTab] = useState<FollowListTab>(initialTab);
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fila con un seguir/dejar de seguir en curso: deshabilita solo su botón.
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  /** Pide una tanda de la solapa indicada. */
  const fetchPage = (which: FollowListTab, offset: number) =>
    which === 'followers'
      ? followService.followers(userId, { limit: PAGE_SIZE, offset })
      : followService.following(userId, { limit: PAGE_SIZE, offset });

  // Primera tanda de cada solapa. Si se cambia de solapa antes de que llegue la
  // respuesta, la vieja se descarta con la bandera.
  useEffect(() => {
    let isCurrent = true;

    fetchPage(tab, 0)
      .then((page) => {
        if (!isCurrent) return;
        setUsers(page);
        // Si la tanda vino llena, puede haber más; si vino corta, era la última.
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((err: unknown) => {
        if (isCurrent) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
    // fetchPage solo depende de userId, que no cambia mientras el modal está abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleTabChange = (next: FollowListTab) => {
    if (next === tab) return;
    setIsLoading(true);
    setError(null);
    setUsers([]);
    setTab(next);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPage(tab, users.length);
      setUsers((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Sigue o deja de seguir a una persona de la lista.
   *
   * La fila se actualiza en el lugar y NO se saca de la lista aunque se la deje de
   * seguir desde "Siguiendo" del perfil propio: si desapareciera en el acto, un
   * click equivocado no tendría vuelta atrás. Al volver a abrir la lista ya no está.
   */
  const handleToggleFollow = async (user: CommunityUser) => {
    if (currentUserId === null) {
      openSignup();
      return;
    }

    setBusyUserId(user.id);
    setError(null);

    try {
      if (user.followedByMe) await followService.unfollow(user.id);
      else await followService.follow(user.id);

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? item.withFollowedByMe(!user.followedByMe) : item))
      );
      onFollowChange();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const renderEmpty = () => {
    if (tab === 'followers') {
      return (
        <EmptyState
          icon={<Users size={22} />}
          title={isOwnProfile ? 'Todavía nadie te sigue.' : `${username} todavía no tiene seguidores.`}
          message={
            isOwnProfile
              ? 'Cuando alguien empiece a seguirte, va a aparecer acá.'
              : 'Podés ser la primera persona en seguir su actividad.'
          }
        />
      );
    }

    return (
      <EmptyState
        icon={<Users size={22} />}
        title={isOwnProfile ? 'Todavía no seguís a nadie.' : `${username} todavía no sigue a nadie.`}
        message={
          isOwnProfile
            ? 'Seguí a otros miembros para ver sus reseñas en el feed de amigos.'
            : undefined
        }
        action={
          isOwnProfile ? (
            <ButtonLink to="/reviews" size="sm">
              Buscar gente para seguir
            </ButtonLink>
          ) : undefined
        }
      />
    );
  };

  return (
    <FormModal isOpen title={isOwnProfile ? 'Tu comunidad' : username} error={error} onClose={onClose}>
      <SegmentedControl
        options={TABS}
        value={tab}
        onChange={(next) => handleTabChange(next)}
        ariaLabel="Lista a mostrar"
      />

      <div className="follow-list">
        {isLoading ? (
          <Loader message="Cargando..." />
        ) : users.length === 0 && !error ? (
          renderEmpty()
        ) : (
          <>
            <ul className="follow-list__items">
              {users.map((user) => (
                <li key={user.id}>
                  <UserRow
                    user={user}
                    meta={`${user.reviewsLabel} · ${user.followersLabel}`}
                    // A uno mismo no se lo puede seguir: la fila propia va sin botón.
                    showFollowButton={user.id !== currentUserId}
                    isBusy={busyUserId === user.id}
                    onToggleFollow={() => handleToggleFollow(user)}
                    onNavigate={onClose}
                  />
                </li>
              ))}
            </ul>

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={isLoadingMore}
                onClick={handleLoadMore}
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            )}
          </>
        )}
      </div>
    </FormModal>
  );
};
