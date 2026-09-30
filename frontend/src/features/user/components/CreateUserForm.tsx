// Formulario de alta de usuarios del panel de administración.
// A diferencia del registro público, acá se elige el rol de la cuenta: es la
// forma de crear otro administrador desde la interfaz.
//
// Es controlado y no llama a la API: delega el submit al padre (AdminUsersPanel).
//
// El marco y el título los pone el modal que lo contiene, igual que en los demás
// formularios del panel: acá adentro va solo el <form>.
//
// Valida con reglas propias (models/userRules), las mismas del registro público.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { Select } from '../../../core/components/Select';
import { fieldErrorProps, hasErrors, validateField } from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { UserRole } from '../models/User';
import { EMAIL_RULES, NEW_PASSWORD_RULES, USERNAME_RULES } from '../models/userRules';
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

type CreateUserField = 'username' | 'email' | 'password';

/** Valida los campos de texto. El rol no se valida: el Select solo ofrece opciones válidas. */
function validateCreateUser(form: typeof EMPTY_FORM): FieldErrors<CreateUserField> {
  return {
    username: validateField(form.username, USERNAME_RULES),
    email: validateField(form.email, EMAIL_RULES),
    password: validateField(form.password, NEW_PASSWORD_RULES),
  };
}

export const CreateUserForm = ({ isSubmitting, onSubmit, onCancel }: CreateUserFormProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  // Los errores se muestran recién después del primer intento de guardar, y desde
  // ahí se recalculan en cada tecla (mismo criterio que AuthModal).
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const errors: FieldErrors<CreateUserField> = wasSubmitted ? validateCreateUser(form) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateCreateUser(form))) return;

    const succeeded = await onSubmit(form);
    // Solo se limpia si el alta salió bien: si falló, el admin conserva lo que
    // escribió para corregirlo en vez de tipearlo de nuevo.
    if (succeeded) {
      setForm(EMPTY_FORM);
      setWasSubmitted(false);
    }
  };

  return (
    <form className="admin-users__form" onSubmit={handleSubmit} noValidate>
      <div className="admin-users__form-grid">
        <FormField id="new-user-username" label="Nombre de usuario" error={errors.username}>
          <TextInput
            id="new-user-username"
            type="text"
            autoComplete="off"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            {...fieldErrorProps('new-user-username', errors.username)}
          />
        </FormField>

        <FormField id="new-user-email" label="Correo electrónico" error={errors.email}>
          {/* type="text" + inputMode: type="email" trae la validación del navegador. */}
          <TextInput
            id="new-user-email"
            type="text"
            inputMode="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            {...fieldErrorProps('new-user-email', errors.email)}
          />
        </FormField>

        <FormField id="new-user-password" label="Contraseña inicial" error={errors.password}>
          <TextInput
            id="new-user-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            {...fieldErrorProps('new-user-password', errors.password)}
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
        <Button variant="subtle" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
};
