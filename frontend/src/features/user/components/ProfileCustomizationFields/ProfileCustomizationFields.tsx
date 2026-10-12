// Parte del formulario de perfil con la personalización Pro: banner y color de
// acento. Va aparte de UserForm para que ese archivo no crezca de más.
//
// Es controlado: recibe los valores y avisa los cambios, y el submit lo arma
// UserForm. Para un FREE no muestra campos sino un cartel que lleva a /pro: la
// API igual rechazaría esos datos, pero así se entiende por qué no están.
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { ButtonLink } from '../../../../core/components/Button';
import { FormField, TextInput } from '../../../../core/components/FormField';
import { fieldErrorProps } from '../../../../core/utils/validators';
import { PROFILE_COLOR_LABELS, PROFILE_COLORS } from '../../models/User';
import type { ProfileColor } from '../../models/User';
import { ProfileBanner } from '../ProfileBanner';
import '../../pages/UserProfilePage/UserProfilePage.scss';
import './ProfileCustomizationFields.scss';

type ProfileCustomizationFieldsProps = {
  /** false para un FREE: se muestra el cartel en vez de los campos. */
  canCustomize: boolean;
  username: string;
  bannerUrl: string;
  /** Mensaje de validación del banner. Lo calcula UserForm, que es el dueño del <form>. */
  bannerUrlError?: string;
  /** Qué franja de la imagen se ve: 0 arriba, 100 abajo. */
  bannerPosition: number;
  profileColor: ProfileColor;
  onBannerUrlChange: (value: string) => void;
  onBannerPositionChange: (value: number) => void;
  onProfileColorChange: (value: ProfileColor) => void;
};

export const ProfileCustomizationFields = ({
  canCustomize,
  username,
  bannerUrl,
  bannerUrlError,
  bannerPosition,
  profileColor,
  onBannerUrlChange,
  onBannerPositionChange,
  onProfileColorChange,
}: ProfileCustomizationFieldsProps) => {
  // Mismo aviso que el del avatar: la URL es válida pero el navegador no la pudo
  // cargar como imagen. Se guarda cuál falló para que el aviso se vaya solo al
  // escribir otra.
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);
  const bannerFailed = bannerUrl.trim() !== '' && bannerUrl === failedBannerUrl;

  if (!canCustomize) {
    return (
      <div className="profile-customization profile-customization--locked">
        <Lock size={18} aria-hidden="true" />
        <div className="profile-customization__locked-text">
          <p className="profile-customization__locked-title">Banner y colores son beneficios Pro</p>
          <p className="profile-customization__locked-hint">
            Con la membresía Pro tu perfil suma una portada, un color propio y el badge Pro al lado
            de tu nombre.
          </p>
        </div>
        <ButtonLink to="/pro" size="sm">
          Ver Pro
        </ButtonLink>
      </div>
    );
  }

  return (
    // La clase de acento hace que la vista previa del banner use el color que
    // se está eligiendo, antes de guardar (ver _user.scss).
    <fieldset
      className={`profile-customization user-profile-page--accent-${profileColor}`}
    >
      <legend className="profile-customization__legend">Personalización Pro</legend>

      {/* Vista previa en vivo, con la misma pieza que dibuja la ficha. */}
      <div className="profile-customization__preview">
        <ProfileBanner
          url={bannerUrl.trim() || null}
          username={username}
          position={bannerPosition}
        />
      </div>

      <FormField
        id="user-form-banner"
        label="Banner del perfil (URL)"
        hint="(opcional)"
        error={bannerUrlError}
      >
        <TextInput
          id="user-form-banner"
          type="text"
          inputMode="url"
          placeholder="https://ejemplo.com/mi-portada.jpg"
          value={bannerUrl}
          onChange={(e) => onBannerUrlChange(e.target.value)}
          {...fieldErrorProps('user-form-banner', bannerUrlError)}
        />
      </FormField>

      {/* La vista previa de arriba ya cae al degradé si la imagen falla; esta
          imagen oculta existe solo para enterarse de la falla y avisar. */}
      {bannerUrl.trim() !== '' && (
        <img
          src={bannerUrl.trim()}
          alt=""
          hidden
          onError={() => setFailedBannerUrl(bannerUrl)}
        />
      )}
      {bannerFailed && (
        <Alert tone="error">
          No pudimos cargar esa imagen. Usá el link de la imagen y no el de la página donde está.
          Mientras tanto se muestra el degradé de tu color.
        </Alert>
      )}

      {/* El encuadre solo tiene sentido con una imagen que cargó: sobre el
          degradé no cambia nada. Se mueve y la vista previa de arriba acompaña
          en vivo, así se ve el recorte antes de guardar. */}
      {bannerUrl.trim() !== '' && !bannerFailed && (
        <FormField id="user-form-banner-position" label="Encuadre del banner">
          <div className="profile-customization__position">
            <span className="profile-customization__position-edge">Arriba</span>
            <input
              id="user-form-banner-position"
              type="range"
              min={0}
              max={100}
              step={1}
              value={bannerPosition}
              onChange={(e) => onBannerPositionChange(Number(e.target.value))}
              className="profile-customization__range"
              aria-valuetext={`${bannerPosition}% desde arriba`}
            />
            <span className="profile-customization__position-edge">Abajo</span>
          </div>
        </FormField>
      )}

      {/* Radios con muestra de color: accesibles con teclado sin librerías. El
          radio real queda oculto a la vista, pero no al lector de pantalla. */}
      <fieldset className="profile-customization__colors">
        <legend className="form-field__label">Color de acento</legend>

        <div className="profile-customization__swatches">
          {PROFILE_COLORS.map((color) => (
            <label
              key={color}
              className={`profile-customization__swatch profile-customization__swatch--${color}`}
              title={PROFILE_COLOR_LABELS[color]}
            >
              <input
                type="radio"
                name="profile-color"
                value={color}
                checked={profileColor === color}
                onChange={() => onProfileColorChange(color)}
                className="profile-customization__radio"
              />
              <span className="profile-customization__swatch-dot" aria-hidden="true" />
              <span className="profile-customization__swatch-label">
                {PROFILE_COLOR_LABELS[color]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </fieldset>
  );
};
