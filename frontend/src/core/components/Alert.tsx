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
import './_alert.scss';

type AlertProps = {
  tone: 'error' | 'success';
  children: ReactNode;
};

export const Alert = ({ tone, children }: AlertProps) => {
  return (
    <p className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
};
