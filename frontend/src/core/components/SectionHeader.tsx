// Cabecera de una sección de listado: ícono, título y, opcionalmente, el enlace
// "Ver todos" de la derecha.
//
// Estaba escrita cuatro veces (explore-section, members-section, top-lists y
// trending-lists) con la misma estructura y los mismos estilos; lo único que
// cambiaba entre una y otra era el color del ícono.
//
//   <SectionHeader
//     icon={<TrendingUp size={22} />}
//     title="Tendencia Ahora"
//     actionLabel="Ver todos"
//     onAction={openSignup}
//   />
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import './_section-header.scss';

/**
 * Color del ícono. Es decorativo y va por sección: verde para el catálogo,
 * dorado para los rankings y naranja para lo que está en llamas.
 */
export type SectionIconTone = 'primary' | 'gold' | 'fire';

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  iconTone?: SectionIconTone;
  /** Hace girar el ícono. Se usa en el disco de "Nuevos Lanzamientos". */
  spinIcon?: boolean;
  /** Texto del botón de la derecha. Sin él, la cabecera va sin acción. */
  actionLabel?: string;
  onAction?: () => void;
};

export const SectionHeader = ({
  icon,
  title,
  iconTone = 'primary',
  spinIcon = false,
  actionLabel,
  onAction,
}: SectionHeaderProps) => {
  const iconClasses = [
    'section-header__icon',
    `section-header__icon--${iconTone}`,
    spinIcon ? 'section-header__icon--spin' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className="section-header">
      <div className="section-header__left">
        <span className={iconClasses} aria-hidden="true">
          {icon}
        </span>
        <h2 className="section-header__title">{title}</h2>
      </div>

      {actionLabel && onAction && (
        <button type="button" className="section-header__action" onClick={onAction}>
          {actionLabel}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </header>
  );
};
