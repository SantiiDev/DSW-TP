// Franja de portada arriba de la cabecera del perfil: beneficio Pro.
//
// Si el usuario cargó una imagen se dibuja esa; si no, o si la URL está rota, un
// degradé con su color de acento. Así un Pro siempre tiene banner, aunque no haya
// elegido imagen: el degradé ya es parte de la personalización.
import { useState } from 'react';
import { DEFAULT_BANNER_POSITION } from '../models/User';

type ProfileBannerProps = {
  /** URL de la imagen, o null para usar el degradé. */
  url: string | null;
  username: string;
  /** Qué franja vertical de la imagen se ve, en porcentaje: 0 arriba, 100 abajo. */
  position?: number;
};

export const ProfileBanner = ({
  url,
  username,
  position = DEFAULT_BANNER_POSITION,
}: ProfileBannerProps) => {
  // Mismo criterio que Avatar: se guarda QUÉ url falló, así si el usuario la
  // cambia la nueva se vuelve a intentar.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage = url !== null && url !== '' && url !== failedUrl;

  return (
    <div className="profile-header__banner">
      {showImage && (
        <img
          className="profile-header__banner-image"
          src={url}
          alt={`Banner del perfil de ${username}`}
          // object-fit: cover recorta la foto para llenar la franja; con
          // object-position se elige qué parte queda a la vista. Es un dato de
          // cada usuario, por eso va en línea y no en el .scss.
          style={{ objectPosition: `50% ${position}%` }}
          onError={() => setFailedUrl(url)}
        />
      )}
    </div>
  );
};
