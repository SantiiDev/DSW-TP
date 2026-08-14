// Página de perfil propio: ver los datos de la cuenta, editarlos o eliminar la
// cuenta. Ruta protegida (ver App.tsx), así que siempre hay un usuario logueado
// cuando este componente se monta.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { UserProfileCard } from '../components/UserProfileCard';
import { UserForm } from '../components/UserForm';
import type { UpdateUserInput } from '../services/userService';
import '../styles/_user.scss';

export const UserProfilePage = () => {
  const { state, updateProfile, deleteAccount, clearError } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ProtectedRoute ya garantiza que haya sesión antes de renderizar esta página,
  // pero mientras se restaura el token todavía puede no estar disponible.
  if (!state.user) {
    return <Loader message="Cargando tu perfil..." />;
  }

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

  // -1 vuelve a la página anterior del historial. Si se entró al perfil con la
  // URL escrita a mano no hay historial propio, así que se cae a la home.
  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
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

          {isEditing ? (
            <UserForm
              initialUsername={state.user.username}
              initialEmail={state.user.email}
              initialAvatarUrl={state.user.urlAvatar}
              isSubmitting={state.isSubmitting}
              error={state.error}
              onSubmit={handleUpdate}
              onCancel={handleCancelEdit}
            />
          ) : (
            <UserProfileCard
              user={state.user}
              onEdit={handleStartEdit}
              onDelete={() => setIsDeleteDialogOpen(true)}
            />
          )}
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
