// Marco de una sección del explorador de música: la cabecera con su ícono y su
// "Ver todos", y los tres estados que puede tener el cuerpo mientras llegan los
// datos (cargando, error, vacío).
//
// Las cinco secciones de /music comparten exactamente esto y se diferencian solo
// en qué le piden a la API y cómo dibujan cada ítem, que es lo que va adentro
// como `children`.
//
// El "Ver todos" es una navegación con sesión (ver useGatedNavigation): a un
// visitante sin cuenta le abre el modal de registro en vez de llevarlo al
// listado.
import type { ReactNode } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Loader } from '../../../core/components/Loader';
import { SectionHeader } from '../../../core/components/SectionHeader';
import type { SectionIconTone } from '../../../core/components/SectionHeader';
import { useGatedNavigation } from '../../../core/hooks/useGatedNavigation';

type ExploreSectionShellProps = {
  icon: ReactNode;
  title: string;
  iconTone?: SectionIconTone;
  /** Hace girar el ícono. Lo usa el disco de "Nuevos Lanzamientos". */
  spinIcon?: boolean;
  /** Ruta del listado completo. Sin ella, la cabecera va sin "Ver todos". */
  seeAllTo?: string;
  isLoading: boolean;
  /** Mensaje de error ya listo para mostrar, o null. */
  error: string | null;
  /** true si la consulta salió bien pero no trajo nada. */
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export const ExploreSectionShell = ({
  icon,
  title,
  iconTone,
  spinIcon,
  seeAllTo,
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: ExploreSectionShellProps) => {
  const { goOrSignup } = useGatedNavigation();

  return (
    <section className="explore-section">
      <SectionHeader
        icon={icon}
        title={title}
        iconTone={iconTone}
        spinIcon={spinIcon}
        actionLabel={seeAllTo ? 'Ver todos' : undefined}
        onAction={seeAllTo ? () => goOrSignup(seeAllTo) : undefined}
      />

      {isLoading ? (
        <Loader message="Cargando..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : isEmpty ? (
        <p className="explore-section__empty">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
};
