// Aviso reutilizable: el cartel de error o de confirmación que aparece arriba de
// una sección después de una operación.
//
// Cada panel tenía su propio __error y su propio __feedback con los mismos
// estilos. Además de unificarlos, el componente se encarga del rol de
// accesibilidad correcto, que antes era fácil de olvidar: los errores se anuncian
// con role="alert" (interrumpen) y las confirmaciones con role="status".
//
//   {error && <Alert tone="error">{error}</Alert>}
import type { ReactNode } from 'react';
import './Alert.scss';

/**
 * `neutral` es el aviso que no dice nada: sirve para dejar el cartel SIEMPRE en
 * pantalla y que su hueco no aparezca y desaparezca corriendo lo de abajo (lo usa
 * el panel de anuncios con su "Sin cambios"). Como no informa de nada que acabe de
 * pasar, es el único tono que no va en una región viva: anunciarle "Sin cambios"
 * a un lector de pantalla sería ruido.
 */
type AlertProps = {
  tone: 'error' | 'success' | 'warning' | 'neutral';
  children: ReactNode;
};

/** Devuelve el rol de accesibilidad que le corresponde a cada tono. */
function roleFor(tone: AlertProps['tone']): 'alert' | 'status' | undefined {
  if (tone === 'error') return 'alert';
  if (tone === 'neutral') return undefined;
  return 'status';
}

export const Alert = ({ tone, children }: AlertProps) => {
  return (
    <p className={`alert alert--${tone}`} role={roleFor(tone)}>
      {children}
    </p>
  );
};
