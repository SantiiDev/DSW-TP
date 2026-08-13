// Formulario para editar el perfil propio (username y email).
// Es un componente controlado: no llama a la API directamente, delega el submit
// al padre a través de la prop onSubmit (que en UserProfilePage usa el
// updateProfile del AuthContext).
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { UpdateUserInput } from '../services/userService';

type UserFormProps = {
  initialUsername: string;
  initialEmail: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (input: UpdateUserInput) => void;
  onCancel: () => void;
};

export const UserForm = ({
  initialUsername,
  initialEmail,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) => {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ username, email });
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      {error && (
        <p className="user-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="user-form__field">
        <label htmlFor="user-form-username" className="user-form__label">
          Nombre de usuario
        </label>
        <input
          id="user-form-username"
          type="text"
          className="user-form__input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={50}
          required
        />
      </div>

      <div className="user-form__field">
        <label htmlFor="user-form-email" className="user-form__label">
          Correo electrónico
        </label>
        <input
          id="user-form-email"
          type="email"
          className="user-form__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="user-form__actions">
        <button
          type="button"
          className="user-form__cancel-btn"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button type="submit" className="user-form__submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
