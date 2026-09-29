// Pastilla de estado reutilizable.
//
// El mismo redondeado en mayúsculas se usaba para el estado de moderación de un
// artista, el estado de una cuenta, el rol de un usuario y la marca de "vos" en
// la tabla del panel; cada uno con su propia copia de los estilos.
//
//   <Badge tone="success">Activo</Badge>
import type { ReactNode } from 'react';
import './_badge.scss';

/**
 * Color de la pastilla, elegido por significado y no por color:
 * neutral (sin novedad), success (aprobado/activo), danger (rechazado/dado de
 * baja), warning (pendiente de revisión) e info (destacado).
 */
export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => {
  return <span className={`badge badge--${tone}`}>{children}</span>;
};
