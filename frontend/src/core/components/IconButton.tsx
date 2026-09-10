// Botón de solo ícono, para las acciones de una fila de tabla.
//
// En el panel de administración cada fila puede tener hasta cuatro acciones
// (editar, aprobar, rechazar, eliminar). Con texto, esa columna se llevaba media
// tabla y empujaba los datos fuera de la pantalla; con íconos entra cómoda.
//
// No es una variante más del Button porque cambia lo esencial: acá el nombre de
// la acción NO se ve, así que el componente obliga a pasar un `label` que va
// como nombre accesible y como globito al pasar el mouse. Sin eso, un botón de
// solo ícono es intocable para un lector de pantalla.
//
//   <IconButton icon={<Pencil size={16} />} label="Editar" onClick={...} />
import type { ReactNode } from 'react';
import './_icon-button.scss';

/**
 * Color del ícono según lo que hace la acción:
 * - neutral: lo que no rompe nada (editar).
 * - success: lo que habilita o aprueba.
 * - danger:  lo destructivo (eliminar, rechazar, suspender).
 */
export type IconButtonTone = 'neutral' | 'success' | 'danger';

type IconButtonProps = {
  /** El ícono, ya con su tamaño (16 en las tablas). */
  icon: ReactNode;
  /** Qué hace el botón. Es su nombre accesible y el texto del globito. */
  label: string;
  tone?: IconButtonTone;
  disabled?: boolean;
  onClick: () => void;
};

export const IconButton = ({
  icon,
  label,
  tone = 'neutral',
  disabled = false,
  onClick,
}: IconButtonProps) => {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${tone}`}
      // aria-label lo nombra para un lector de pantalla y title dibuja el globito
      // del navegador para quien lo ve: hacen falta los dos.
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};
