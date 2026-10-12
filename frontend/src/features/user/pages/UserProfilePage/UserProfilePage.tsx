// Página de perfil de usuario. Sirve dos rutas con el mismo componente:
//
//   /profile     el perfil propio, con edición y baja de cuenta.
//   /users/:id   el perfil público de otro usuario, solo lectura.
//
// La diferencia entre una y otra es isOwnProfile: qué botones se muestran y qué
// pestañas están disponibles. Los datos privados (email, membresía) los filtra
// además el backend, que es donde vale la restricción.
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { BackLink } from '../../../../core/components/BackLink';
import { useAuth } from '../../../../core/context/AuthContext';
import { useAuthModal } from '../../../../core/context/AuthModalContext';
import { Navbar } from '../../../../core/components/Navbar';
import { Footer } from '../../../../core/components/Footer';
import { Loader } from '../../../../core/components/Loader';
import { EmptyState } from '../../../../core/components/EmptyState';
import { ConfirmDialog } from '../../../../core/components/Modal';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { FollowListModal } from '../../components/FollowListModal';
import type { FollowListTab } from '../../components/FollowListModal';
import { ProfileHeader } from '../../components/ProfileHeader';
import { ProfileTabs } from '../../components/ProfileTabs';
import { PROFILE_TABS, getVisibleTabs } from '../../models/profileTabs';
import type { ProfileTab } from '../../models/profileTabs';
import { ProfileTabContent } from '../../components/ProfileTabContent';
import { ProfileSidebar } from '../../components/ProfileSidebar';
import { UserForm } from '../../components/UserForm';
import { followService } from '../../services/followService';
import type { UpdateUserInput } from '../../services/userService';
import { useProfileData } from './useProfileData';
import './UserProfilePage.scss';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { state: authState, updateProfile, deleteAccount, clearError } = useAuth();
  const { openSignup } = useAuthModal();
  const navigate = useNavigate();

  // La pestaña inicial puede venir en la URL (/profile?tab=stats): así otras
  // pantallas, como el área de socio de /pro, pueden llevar directo a una sección.
  // Si el valor no es una pestaña conocida, se arranca en el resumen.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    PROFILE_TABS.find((tab) => tab === requestedTab) ?? 'resumen'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Hay un seguir/dejar de seguir en curso: deshabilita el botón para no mandar
  // dos veces la misma operación.
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  // Lista de seguimiento abierta en la ventana, o null si está cerrada.
  const [followListTab, setFollowListTab] = useState<FollowListTab | null>(null);

  const profileId = id ? Number(id) : authState.user?.id;
  const isOwnProfile = profileId !== undefined && profileId === authState.user?.id;

  const {
    fetchedUser,
    isLoading,
    loadError,
    setLoadError,
    reviewStats,
    loadReviewStats,
    followStats,
    setFollowStats,
    loadFollowStats,
    headerStats,
  } = useProfileData(profileId, isOwnProfile);

  // Perfil que se está mirando. En el propio se usa el usuario del contexto, así
  // los cambios de la edición se reflejan sin volver a pedirlo a la API.
  const viewedUser = isOwnProfile ? authState.user : fetchedUser;

  // Al pasar del perfil propio al de otro, la pestaña elegida puede dejar de
  // existir (Membresía y Aportes no siempre están). En ese caso se muestra la
  // primera visible en vez de una pantalla en blanco.
  const visibleTabs = viewedUser ? getVisibleTabs(viewedUser, isOwnProfile) : [];
  const currentTab = visibleTabs.includes(activeTab) ? activeTab : (visibleTabs[0] ?? 'resumen');

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
          canCustomize={viewedUser.canCustomizeProfile}
          initialBannerUrl={viewedUser.urlBanner}
          initialBannerPosition={viewedUser.bannerPosition}
          initialProfileColor={viewedUser.profileColor}
          isSubmitting={authState.isSubmitting}
          error={authState.error}
          onSubmit={handleUpdate}
          onCancel={handleCancelEdit}
        />
      );
    }

    return (
      <>
        <ProfileHeader
          user={viewedUser}
          stats={headerStats}
          isOwnProfile={isOwnProfile}
          isFollowing={followStats?.followedByMe ?? false}
          isFollowBusy={isFollowBusy}
          onEdit={handleStartEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onToggleFollow={handleToggleFollow}
          onOpenFollowList={setFollowListTab}
        />

        {/* Se monta recién al abrirse, así cada apertura arranca limpia y con la
            solapa del contador que se tocó. Al seguir o dejar de seguir a alguien
            desde adentro se rehacen los contadores de la cabecera. */}
        {followListTab && (
          <FollowListModal
            userId={viewedUser.id}
            username={viewedUser.username}
            isOwnProfile={isOwnProfile}
            initialTab={followListTab}
            onClose={() => setFollowListTab(null)}
            onFollowChange={loadFollowStats}
          />
        )}

        <ProfileTabs
          user={viewedUser}
          isOwnProfile={isOwnProfile}
          activeTab={currentTab}
          onChange={setActiveTab}
        />

        <div className="user-profile-page__body">
          <div className="user-profile-page__main">
            <ProfileTabContent
              user={viewedUser}
              isOwnProfile={isOwnProfile}
              activeTab={currentTab}
              // Al borrar una reseña hay que rehacer los contadores y el histograma.
              onReviewsChange={loadReviewStats}
              onShowAllReviews={() => setActiveTab('reviews')}
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
      {/* El color de acento del dueño del perfil tiñe el banner, el borde del
          avatar y las pestañas (ver _user.scss). visibleColor ya vuelve al verde
          si la cuenta no es Pro. */}
      <main
        className={`user-profile-page user-profile-page--accent-${viewedUser?.visibleColor ?? 'green'}`}
      >
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
