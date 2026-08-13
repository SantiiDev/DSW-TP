// Página de perfil propio: ver los datos de la cuenta, editarlos o eliminar la
// cuenta. Ruta protegida (ver App.tsx), así que siempre hay un usuario logueado
// cuando este componente se monta.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { Loader } from '../../../core/components/Loader';
import { UserProfileCard } from '../components/UserProfileCard';
import { UserForm } from '../components/UserForm';
import type { UpdateUserInput } from '../services/userService';
import '../styles/_user.scss';

export const UserProfilePage = () => {
  const { state, updateProfile, deleteAccount, clearError } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

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

  const handleDelete = async () => {
    // Confirmación simple: es una acción irreversible y no hay vuelta atrás una
    // vez que se manda la request.
    const confirmed = window.confirm(
      '¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    const succeeded = await deleteAccount();
    if (succeeded) navigate('/');
  };

  return (
    <section className="user-profile-page">
      <div className="user-profile-page__container">
        {isEditing ? (
          <UserForm
            initialUsername={state.user.username}
            initialEmail={state.user.email}
            isSubmitting={state.isSubmitting}
            error={state.error}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
          />
        ) : (
          <UserProfileCard user={state.user} onEdit={handleStartEdit} onDelete={handleDelete} />
        )}
      </div>
    </section>
  );
};
