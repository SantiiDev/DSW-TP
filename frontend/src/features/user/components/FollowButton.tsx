// Botón de seguir / dejar de seguir a un usuario.
//
// Es presentacional: no llama a la API ni guarda estado. Recibe si ya lo sigue y
// avisa al padre cuando lo aprietan. Está así para poder usar el MISMO botón en
// la cabecera del perfil y en cada tarjeta del panel "Gente para seguir", que es
// lo que evita tener dos botones parecidos con lógicas que se desincronizan.
import { Check, UserPlus } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import type { ButtonSize } from '../../../core/components/Button';

type FollowButtonProps = {
  isFollowing: boolean;
  /** Hay una operación en curso: se deshabilita para no mandar dos veces. */
  isBusy: boolean;
  /** 'sm' en las tarjetas del panel, 'md' en la cabecera del perfil. */
  size?: ButtonSize;
  fullWidth?: boolean;
  onToggle: () => void;
};

export const FollowButton = ({
  isFollowing,
  isBusy,
  size = 'md',
  fullWidth = false,
  onToggle,
}: FollowButtonProps) => {
  return (
    <Button
      // Seguir es la acción que se ofrece, así que va destacada; una vez que ya lo
      // seguís el botón deja de ser una invitación y pasa a ser un estado, con el
      // peso visual de una acción secundaria.
      variant={isFollowing ? 'outline' : 'primary'}
      size={size}
      fullWidth={fullWidth}
      disabled={isBusy}
      // El texto dice el estado actual, no la acción: es lo que espera cualquiera
      // que haya usado una red social. El title aclara qué pasa si se aprieta.
      title={isFollowing ? 'Dejar de seguir' : undefined}
      onClick={onToggle}
    >
      {isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </Button>
  );
};
