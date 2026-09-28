// Formulario para editar el perfil propio (foto, username, email y, si la cuenta
// es Pro, banner y color).
// Es un componente controlado: no llama a la API directamente, delega el submit
// al padre a través de la prop onSubmit (que en UserProfilePage usa el
// updateProfile del AuthContext).
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Avatar } from '../../../core/components/Avatar';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { DEFAULT_BANNER_POSITION, DEFAULT_PROFILE_COLOR } from '../models/User';
import type { ProfileColor } from '../models/User';
import type { UpdateUserInput } from '../services/userService';
import { ProfileCustomizationFields } from './ProfileCustomizationFields';

// Imagen de ejemplo para probar el campo rápido. Es un servicio de fotos random
// que devuelve la imagen directamente, así que sirve como referencia de "URL que
// sí funciona" cuando alguien pega el link de una página por error.
const EXAMPLE_AVATAR_URL = 'https://picsum.photos/200';

type UserFormProps = {
  initialUsername: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  /** true si la cuenta es Pro o Admin: habilita banner y color. */
  canCustomize: boolean;
  initialBannerUrl: string | null;
  initialBannerPosition: number;
  initialProfileColor: ProfileColor | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (input: UpdateUserInput) => void;
  onCancel: () => void;
};

export const UserForm = ({
  initialUsername,
  initialEmail,
  initialAvatarUrl,
  canCustomize,
  initialBannerUrl,
  initialBannerPosition,
  initialProfileColor,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) => {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  // El input siempre maneja string: null (sin foto) se representa como vacío.
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '');
  // URL válida que el navegador no pudo cargar como imagen. Pasa sobre todo
  // cuando se pega el link de la página donde está la foto en vez del de la foto
  // misma. Se guarda cuál falló: si después se escribe otra, el aviso se va solo.
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarFailed = avatarUrl === failedAvatarUrl;
  // Personalización Pro. Mismo criterio que el avatar: el campo maneja string, y
  // sin color elegido se muestra marcado el verde por defecto.
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? '');
  const [bannerPosition, setBannerPosition] = useState(
    initialBannerPosition ?? DEFAULT_BANNER_POSITION
  );
  const [profileColor, setProfileColor] = useState<ProfileColor>(
    initialProfileColor ?? DEFAULT_PROFILE_COLOR
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // url_avatar viaja aunque esté vacío: así el backend sabe que hay que borrar
    // la foto y volver al avatar por defecto.
    const input: UpdateUserInput = { username, email, url_avatar: avatarUrl.trim() };

    // Banner y color viajan solo si la cuenta puede usarlos: la API los rechaza
    // con 403 en una cuenta FREE, y un FREE ni siquiera tiene los campos.
    if (canCustomize) {
      input.url_banner = bannerUrl.trim();
      input.banner_position = bannerPosition;
      input.profile_color = profileColor;
    }

    onSubmit(input);
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      {error && <Alert tone="error">{error}</Alert>}

      {/* Vista previa en vivo: el usuario ve cómo queda la foto antes de guardar. */}
      <div className="user-form__avatar-preview">
        <Avatar
          url={avatarUrl.trim() || null}
          username={username}
          size="lg"
          onLoadError={() => setFailedAvatarUrl(avatarUrl)}
        />
        <p className="user-form__avatar-hint">
          Pegá el link de una imagen. Si lo dejás vacío se usa el avatar por defecto.
        </p>
      </div>

      <FormField id="user-form-avatar" label="Foto de perfil (URL)">
        <TextInput
          id="user-form-avatar"
          type="url"
          placeholder="https://ejemplo.com/mi-foto.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          maxLength={500}
        />

        {/* El error más común no es una URL mal escrita sino el link de la página
            donde está la foto. Como el backend no puede distinguirlos (los dos son
            URLs válidas), se avisa acá, cuando el navegador falla al cargarla. */}
        {avatarFailed && (
          <Alert tone="error">
            No pudimos cargar esa imagen. Asegurate de que el link sea el de la foto y no
            el de la página donde está: hacé clic derecho sobre la imagen y elegí{' '}
            <em>Copiar dirección de imagen</em>.
          </Alert>
        )}

        <button
          type="button"
          className="user-form__example-btn"
          onClick={() => setAvatarUrl(EXAMPLE_AVATAR_URL)}
        >
          Probar con una imagen de ejemplo
        </button>
      </FormField>

      <FormField id="user-form-username" label="Nombre de usuario">
        <TextInput
          id="user-form-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={50}
          required
        />
      </FormField>

      <FormField id="user-form-email" label="Correo electrónico">
        <TextInput
          id="user-form-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>

      <ProfileCustomizationFields
        canCustomize={canCustomize}
        username={username}
        bannerUrl={bannerUrl}
        bannerPosition={bannerPosition}
        profileColor={profileColor}
        onBannerUrlChange={setBannerUrl}
        onBannerPositionChange={setBannerPosition}
        onProfileColorChange={setProfileColor}
      />

      <div className="user-form__actions">
        <Button variant="subtle" fullWidth onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
};
