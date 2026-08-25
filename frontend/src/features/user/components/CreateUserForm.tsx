// Formulario de alta de usuarios del panel de administración.
// A diferencia del registro público, acá se elige el rol de la cuenta: es la
// forma de crear otro administrador desde la interfaz.
//
// Es controlado y no llama a la API: delega el submit al padre (AdminUsersPanel).
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Select } from '../../../core/components/Select';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { UserRole } from '../models/User';
import type { CreateUserInput } from '../services/userService';

type CreateUserFormProps = {
  isSubmitting: boolean;
  onSubmit: (input: CreateUserInput) => Promise<boolean>;
};

const EMPTY_FORM = {
  username: '',
  email: '',
  password: '',
  rol: 'FREE' as UserRole,
};

export const CreateUserForm = ({ isSubmitting, onSubmit }: CreateUserFormProps) => {
  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const succeeded = await onSubmit(form);
    // Solo se limpia si el alta salió bien: si falló, el admin conserva lo que
    // escribió para corregirlo en vez de tipearlo de nuevo.
    if (succeeded) setForm(EMPTY_FORM);
  };

  return (
    <form className="admin-users__form" onSubmit={handleSubmit}>
      <h2 className="admin-users__form-title">Crear usuario</h2>

      <div className="admin-users__form-grid">
        <div className="admin-users__field">
          <label htmlFor="new-user-username" className="admin-users__label">
            Nombre de usuario
          </label>
          <input
            id="new-user-username"
            type="text"
            className="admin-users__input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            minLength={3}
            maxLength={50}
            required
          />
        </div>

        <div className="admin-users__field">
          <label htmlFor="new-user-email" className="admin-users__label">
            Correo electrónico
          </label>
          <input
            id="new-user-email"
            type="email"
            className="admin-users__input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="admin-users__field">
          <label htmlFor="new-user-password" className="admin-users__label">
            Contraseña inicial
          </label>
          <input
            id="new-user-password"
            type="password"
            className="admin-users__input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            // El mínimo se valida igual en el backend; acá es solo para avisar
            // antes de gastar una request.
            minLength={8}
            required
          />
        </div>

        <div className="admin-users__field">
          <label htmlFor="new-user-rol" className="admin-users__label">
            Rol
          </label>
          <Select
            id="new-user-rol"
            options={USER_ROLES.map((rol) => ({ value: rol, label: ROLE_LABELS[rol] }))}
            value={form.rol}
            onChange={(rol) => setForm({ ...form, rol })}
            fullWidth
          />
        </div>
      </div>

      <button type="submit" className="admin-users__submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear usuario'}
      </button>
    </form>
  );
};
