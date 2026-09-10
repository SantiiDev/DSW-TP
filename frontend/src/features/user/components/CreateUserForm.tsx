// Formulario de alta de usuarios del panel de administración.
// A diferencia del registro público, acá se elige el rol de la cuenta: es la
// forma de crear otro administrador desde la interfaz.
//
// Es controlado y no llama a la API: delega el submit al padre (AdminUsersPanel).
//
// El marco y el título los pone el modal que lo contiene, igual que en los demás
// formularios del panel: acá adentro va solo el <form>.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { Select } from '../../../core/components/Select';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { UserRole } from '../models/User';
import type { CreateUserInput } from '../services/userService';

type CreateUserFormProps = {
  isSubmitting: boolean;
  onSubmit: (input: CreateUserInput) => Promise<boolean>;
  /** Cierra el modal sin crear nada. */
  onCancel: () => void;
};

const EMPTY_FORM = {
  username: '',
  email: '',
  password: '',
  rol: 'FREE' as UserRole,
};

const ROLE_OPTIONS = USER_ROLES.map((rol) => ({ value: rol, label: ROLE_LABELS[rol] }));

export const CreateUserForm = ({ isSubmitting, onSubmit, onCancel }: CreateUserFormProps) => {
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
      <div className="admin-users__form-grid">
        <FormField id="new-user-username" label="Nombre de usuario">
          <TextInput
            id="new-user-username"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            minLength={3}
            maxLength={50}
            required
          />
        </FormField>

        <FormField id="new-user-email" label="Correo electrónico">
          <TextInput
            id="new-user-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </FormField>

        <FormField id="new-user-password" label="Contraseña inicial">
          <TextInput
            id="new-user-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            // El mínimo se valida igual en el backend; acá es solo para avisar
            // antes de gastar una request.
            minLength={8}
            required
          />
        </FormField>

        <FormField id="new-user-rol" label="Rol">
          <Select
            id="new-user-rol"
            options={ROLE_OPTIONS}
            value={form.rol}
            onChange={(rol) => setForm({ ...form, rol })}
            fullWidth
          />
        </FormField>
      </div>

      {/* Mismo par de botones que el resto de los formularios del panel. */}
      <div className="admin-users__form-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear usuario'}
        </Button>

        <Button variant="subtle" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
