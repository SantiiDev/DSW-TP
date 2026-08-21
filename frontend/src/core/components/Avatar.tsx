// Avatar circular de un usuario.
// Muestra su foto de perfil, y si no tiene (o si la URL está rota) cae en un
// ícono por defecto. Lo usan el navbar, la página de perfil y la tabla del panel
// de administración.
import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import './_avatar.scss';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  /** URL de la foto, o null para el avatar por defecto. */
  url: string | null;
  /** Nombre del usuario: se usa para el texto alternativo de la imagen. */
  username: string;
  size?: AvatarSize;
  /**
   * Avisa si la imagen no se pudo cargar. Lo usa el formulario de perfil para
   * explicarle al usuario que el link no sirve, en vez de caer al ícono en
   * silencio y dejarlo pensando que la foto no se guardó.
   */
  onLoadError?: () => void;
};

// Tamaño del ícono por defecto en píxeles, para que acompañe al del círculo.
const ICON_SIZES: Record<AvatarSize, number> = {
  sm: 16,
  md: 20,
  lg: 40,
};

export const Avatar = ({ url, username, size = 'sm', onLoadError }: AvatarProps) => {
  // Una URL puede apuntar a algo que no existe o dejar de responder. Si la imagen
  // falla se dibuja el ícono, para no dejar el círculo roto o vacío.
  const [hasFailed, setHasFailed] = useState(false);

  // Si el usuario cambia su foto hay que volver a intentar: sin esto, una URL
  // rota anterior dejaría el avatar en el ícono para siempre.
  useEffect(() => {
    setHasFailed(false);
  }, [url]);

  const showImage = url !== null && url !== '' && !hasFailed;

  return (
    <span className={`avatar avatar--${size}`}>
      {showImage ? (
        <img
          className="avatar__image"
          src={url}
          alt={`Foto de perfil de ${username}`}
          onError={() => {
            setHasFailed(true);
            onLoadError?.();
          }}
        />
      ) : (
        <UserIcon className="avatar__icon" size={ICON_SIZES[size]} aria-hidden="true" />
      )}
    </span>
  );
};
