// Página de perfil de usuario. Sirve dos rutas con el mismo componente:
//
//   /profile     el perfil propio, con edición y baja de cuenta.
//   /users/:id   el perfil público de otro usuario, solo lectura.
//
// La diferencia entre una y otra es isOwnProfile: qué botones se muestran y qué
// pestañas están disponibles. Los datos privados (email, membresía) los filtra
// además el backend, que es donde vale la restricción.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { BackLink } from '../../../core/components/BackLink';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { ConfirmDialog } from '../../../core/components/Modal';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs, getVisibleTabs } from '../components/ProfileTabs';
import type { ProfileTab } from '../components/ProfileTabs';
import { ProfileTabContent } from '../components/ProfileTabContent';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { UserForm } from '../components/UserForm';
import { reviewService } from '../../review/services/reviewService';
import type { ReviewStats } from '../../review/models/Review';
import { EMPTY_PROFILE_STATS } from '../models/ProfileStats';
import type { ProfileStats } from '../models/ProfileStats';
import type { FollowStats } from '../models/Follow';
import type { User } from '../models/User';
import { followService } from '../services/followService';
import { userService } from '../services/userService';
import type { UpdateUserInput } from '../services/userService';
import '../styles/_user.scss';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { state: authState, updateProfile, deleteAccount, clearError } = useAuth();
  const { openSignup } = useAuthModal();
  const navigate = useNavigate();

  // Perfil que se está mirando. En el propio se usa el usuario del contexto, así
  // los cambios de la edición se reflejan sin volver a pedirlo a la API.
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('resumen');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Estadísticas de las reseñas del perfil. Se piden UNA vez acá y se reparten:
  // la cabecera las usa para sus contadores y la columna lateral para el
  // histograma de calificaciones. null mientras no llegaron.
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  // Seguidores, seguidos y si el que mira sigue a este perfil. Se piden aparte de
  // las de reseñas porque salen de otra tabla y de otro endpoint. null mientras
  // no llegaron.
  const [followStats, setFollowStats] = useState<FollowStats | null>(null);
  // Hay un seguir/dejar de seguir en curso: deshabilita el botón para no mandar
  // dos veces la misma operación.
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  const profileId = id ? Number(id) : authState.user?.id;
  const isOwnProfile = profileId !== undefined && profileId === authState.user?.id;

  const loadUser = useCallback(async (userId: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setViewedUser(await userService.getById(userId));
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setViewedUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profileId === undefined) return;

    // El perfil propio ya está en el contexto: pedirlo de nuevo sería una request
    // al pedo y encima haría parpadear la pantalla después de cada edición.
    if (isOwnProfile && authState.user) {
      setViewedUser(authState.user);
      return;
    }

    void loadUser(profileId);
  }, [profileId, isOwnProfile, authState.user, loadUser]);

  // Trae las estadísticas de reseñas del perfil que se está mirando.
  // Se declara con useCallback porque también se llama a mano cuando el usuario
  // borra una reseña desde la pestaña "Reseñas".
  const loadReviewStats = useCallback(async () => {
    if (profileId === undefined) return;

    try {
      setReviewStats(await reviewService.stats(profileId));
    } catch {
      // Que fallen las estadísticas no puede tirar abajo el perfil entero: se
      // dejan en null y los contadores y el histograma quedan en cero.
      setReviewStats(null);
    }
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReviewStats();
  }, [loadReviewStats]);

  // Trae los contadores de seguimiento del perfil que se está mirando.
  const loadFollowStats = useCallback(async () => {
    if (profileId === undefined) return;

    try {
      setFollowStats(await followService.stats(profileId));
    } catch {
      // Mismo criterio que con las estadísticas de reseñas: que fallen los
      // contadores no puede tirar abajo el perfil entero.
      setFollowStats(null);
    }
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFollowStats();
  }, [loadFollowStats]);

  // Al pasar del perfil propio al de otro, la pestaña activa puede dejar de
  // existir (Membresía y Aportes no siempre están). En ese caso se vuelve a la
  // primera visible en vez de mostrar una pantalla en blanco.
  useEffect(() => {
    if (!viewedUser) return;

    const visible = getVisibleTabs(viewedUser, isOwnProfile);
    if (!visible.includes(activeTab)) setActiveTab(visible[0]);
  }, [viewedUser, isOwnProfile, activeTab]);

  const handleStartEdit = () => {
    clearError();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    clearError();
    setIsEditing(false);
  };

  const handleUpdate = async (input: UpdateUserInput) => {
    const succeeded = await updateProfile(input);
    if (succeeded) setIsEditing(false);
  };

  /**
   * Sigue o deja de seguir al dueño de este perfil.
   *
   * Sin sesión no hay a quién anotar como seguidor, así que se ofrece la cuenta.
   * El resultado de la API ya trae los contadores actualizados, así que se guardan
   * tal cual en vez de volver a pedirlos.
   */
  const handleToggleFollow = async () => {
    if (authState.status !== 'authenticated') {
      openSignup();
      return;
    }

    if (profileId === undefined || followStats === null) return;

    setIsFollowBusy(true);

    try {
      setFollowStats(
        followStats.followedByMe
          ? await followService.unfollow(profileId)
          : await followService.follow(profileId)
      );
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsFollowBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleteDialogOpen(false);
    const succeeded = await deleteAccount();
    if (succeeded) navigate('/');
  };

  const renderContent = () => {
    if (isLoading) return <Loader message="Cargando perfil..." />;

    if (loadError) return <Alert tone="error">{loadError}</Alert>;

    if (!viewedUser) return <Loader message="Cargando perfil..." />;

    // Cuenta dada de baja (baja lógica: sigue existiendo, pero no se puede
    // mostrar como si nada). No debería pasar en el perfil propio, porque una
    // cuenta suspendida se desloguea sola al pedir /auth/me, pero sí al entrar
    // a /users/:id de un usuario que un admin suspendió.
    if (!viewedUser.isActive) {
      return (
        <EmptyState
          icon={<UserX size={24} aria-hidden="true" />}
          title="Esta cuenta fue suspendida"
          message={`${viewedUser.username} ya no está disponible en Musicboxd.`}
        />
      );
    }

    // La edición reemplaza todo el contenido: es una pantalla de formulario, no
    // una pestaña más.
    if (isEditing) {
      return (
        <UserForm
          initialUsername={viewedUser.username}
          initialEmail={viewedUser.email}
          initialAvatarUrl={viewedUser.urlAvatar}
          isSubmitting={authState.isSubmitting}
          error={authState.error}
          onSubmit={handleUpdate}
          onCancel={handleCancelEdit}
        />
      );
    }

    // Las cuatro cajas de la cabecera salen de dos endpoints distintos: dos de las
    // estadísticas de reseñas y dos de los contadores de seguimiento. Cada mitad
    // queda en cero mientras su respuesta no llegó, sin bloquear a la otra.
    const stats: ProfileStats = {
      ...EMPTY_PROFILE_STATS,
      ...(reviewStats === null
        ? {}
        : { reviews: reviewStats.total, listened: reviewStats.listened }),
      ...(followStats === null
        ? {}
        : { following: followStats.following, followers: followStats.followers }),
    };

    return (
      <>
        <ProfileHeader
          user={viewedUser}
          stats={stats}
          isOwnProfile={isOwnProfile}
          isFollowing={followStats?.followedByMe ?? false}
          isFollowBusy={isFollowBusy}
          onEdit={handleStartEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onToggleFollow={handleToggleFollow}
        />

        <ProfileTabs
          user={viewedUser}
          isOwnProfile={isOwnProfile}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="user-profile-page__body">
          <div className="user-profile-page__main">
            <ProfileTabContent
              user={viewedUser}
              isOwnProfile={isOwnProfile}
              activeTab={activeTab}
              // Al borrar una reseña hay que rehacer los contadores y el histograma.
              onReviewsChange={loadReviewStats}
            />
          </div>

          <ProfileSidebar
            user={viewedUser}
            isOwnProfile={isOwnProfile}
            stats={reviewStats}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <main className="user-profile-page">
        <div className="user-profile-page__container">
          {/* El mismo botón que usan las fichas de álbum y canción y los
              listados: vive en core/components para que "Volver" se vea y se
              comporte igual en todo el sitio. */}
          <BackLink fallbackTo="/" />

          {renderContent()}
        </div>
      </main>
      <Footer />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Dar de baja la cuenta"
        message="¿Seguro que querés dar de baja tu cuenta? Vas a salir de la sesión y no vas a poder volver a entrar. Tus reseñas se mantienen, y un administrador puede reactivarla si cambiás de opinión."
        confirmLabel="Dar de baja"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
};
