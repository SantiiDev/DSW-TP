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
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs, getVisibleTabs } from '../components/ProfileTabs';
import type { ProfileTab } from '../components/ProfileTabs';
import { ProfileTabContent } from '../components/ProfileTabContent';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { UserForm } from '../components/UserForm';
import { EMPTY_PROFILE_STATS } from '../models/ProfileStats';
import type { User } from '../models/User';
import { userService } from '../services/userService';
import type { UpdateUserInput } from '../services/userService';
import '../styles/_user.scss';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { state: authState, updateProfile, deleteAccount, clearError } = useAuth();
  const navigate = useNavigate();

  // Perfil que se está mirando. En el propio se usa el usuario del contexto, así
  // los cambios de la edición se reflejan sin volver a pedirlo a la API.
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('resumen');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleConfirmDelete = async () => {
    setIsDeleteDialogOpen(false);
    const succeeded = await deleteAccount();
    if (succeeded) navigate('/');
  };

  // -1 vuelve a la página anterior del historial. Si se entró con la URL escrita
  // a mano no hay historial propio, así que se cae a la home.
  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const renderContent = () => {
    if (isLoading) return <Loader message="Cargando perfil..." />;

    if (loadError) {
      return (
        <p className="user-profile-page__error" role="alert">
          {loadError}
        </p>
      );
    }

    if (!viewedUser) return <Loader message="Cargando perfil..." />;

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

    return (
      <>
        <ProfileHeader
          user={viewedUser}
          stats={EMPTY_PROFILE_STATS}
          isOwnProfile={isOwnProfile}
          onEdit={handleStartEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
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
            />
          </div>

          <ProfileSidebar user={viewedUser} isOwnProfile={isOwnProfile} />
        </div>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <main className="user-profile-page">
        <div className="user-profile-page__container">
          <button type="button" className="user-profile-page__back-btn" onClick={handleGoBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Volver
          </button>

          {renderContent()}
        </div>
      </main>
      <Footer />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Eliminar cuenta"
        message="¿Seguro que querés eliminar tu cuenta? Se borrarán todos tus datos y esta acción no se puede deshacer."
        confirmLabel="Eliminar cuenta"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
};
