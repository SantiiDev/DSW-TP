// Formulario para editar el perfil propio (foto, username y email).
// Es un componente controlado: no llama a la API directamente, delega el submit
// al padre a través de la prop onSubmit (que en UserProfilePage usa el
// updateProfile del AuthContext).
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar } from '../../../core/components/Avatar';
import type { UpdateUserInput } from '../services/userService';

// Imagen de ejemplo para probar el campo rápido. Es un servicio de fotos random
// que devuelve la imagen directamente, así que sirve como referencia de "URL que
// sí funciona" cuando alguien pega el link de una página por error.
const EXAMPLE_AVATAR_URL = 'https://picsum.photos/200';

type UserFormProps = {
  initialUsername: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (input: UpdateUserInput) => void;
  onCancel: () => void;
};

export const UserForm = ({
  initialUsername,
  initialEmail,
  initialAvatarUrl,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) => {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  // El input siempre maneja string: null (sin foto) se representa como vacío.
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '');
  // La URL es válida pero el navegador no pudo cargarla como imagen. Pasa sobre
  // todo cuando se pega el link de la página donde está la foto en vez del de la
  // foto misma.
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Cada vez que cambia la URL se vuelve a intentar: si no, un link roto dejaría
  // el aviso puesto para siempre aunque después se escriba uno bueno.
  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // url_avatar viaja aunque esté vacío: así el backend sabe que hay que borrar
    // la foto y volver al avatar por defecto.
    onSubmit({ username, email, url_avatar: avatarUrl.trim() });
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      {error && (
        <p className="user-form__error" role="alert">
          {error}
        </p>
      )}

      {/* Vista previa en vivo: el usuario ve cómo queda la foto antes de guardar. */}
      <div className="user-form__avatar-preview">
        <Avatar
          url={avatarUrl.trim() || null}
          username={username}
          size="lg"
          onLoadError={() => setAvatarFailed(true)}
        />
        <p className="user-form__avatar-hint">
          Pegá el link de una imagen. Si lo dejás vacío se usa el avatar por defecto.
        </p>
      </div>

      <div className="user-form__field">
        <label htmlFor="user-form-avatar" className="user-form__label">
          Foto de perfil (URL)
        </label>
        <input
          id="user-form-avatar"
          type="url"
          className="user-form__input"
          placeholder="https://ejemplo.com/mi-foto.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          maxLength={500}
        />

        {/* El error más común no es una URL mal escrita sino el link de la página
            donde está la foto. Como el backend no puede distinguirlos (los dos son
            URLs válidas), se avisa acá, cuando el navegador falla al cargarla. */}
        {avatarFailed && (
          <p className="user-form__avatar-warning" role="alert">
            No pudimos cargar esa imagen. Asegurate de que el link sea el de la foto y no
            el de la página donde está: hacé clic derecho sobre la imagen y elegí{' '}
            <em>Copiar dirección de imagen</em>.
          </p>
        )}

        <button
          type="button"
          className="user-form__example-btn"
          onClick={() => setAvatarUrl(EXAMPLE_AVATAR_URL)}
        >
          Probar con una imagen de ejemplo
        </button>
      </div>

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
