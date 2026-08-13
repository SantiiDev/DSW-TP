// Tarjeta de solo lectura con los datos del perfil propio.
// Puramente presentacional: UserProfilePage decide cuándo mostrarla (vs. el
// formulario de edición) y qué hacer con los clicks de editar/eliminar.
import type { User } from '../models/User';

type UserProfileCardProps = {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
};

const ROLE_LABELS: Record<User['rol'], string> = {
  FREE: 'Miembro',
  PRO: 'Miembro Pro',
  PATRON: 'Patrocinador',
  ADMIN: 'Administrador',
};

export const UserProfileCard = ({ user, onEdit, onDelete }: UserProfileCardProps) => {
  return (
    <div className="user-profile-card">
      <div className="user-profile-card__header">
        <h1 className="user-profile-card__username">{user.username}</h1>
        <span className="user-profile-card__role">{ROLE_LABELS[user.rol]}</span>
      </div>

      <dl className="user-profile-card__details">
        <div className="user-profile-card__detail">
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="user-profile-card__detail">
          <dt>Miembro desde</dt>
          <dd>{user.registrationDate.toLocaleDateString('es-AR')}</dd>
        </div>
      </dl>

      <div className="user-profile-card__actions">
        <button type="button" className="user-profile-card__edit-btn" onClick={onEdit}>
          Editar perfil
        </button>
        <button type="button" className="user-profile-card__delete-btn" onClick={onDelete}>
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
};
