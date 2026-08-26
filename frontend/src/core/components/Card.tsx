// Tarjeta reutilizable: la superficie elevada del sitio.
//
// Es el bloque gris oscuro con borde y esquinas redondeadas que usan los
// formularios del panel, las secciones de administración y los recuadros de
// contenido. Antes cada feature lo redefinía con otro nombre (__form-block,
// __form, __block) y los mismos cuatro valores de fondo, borde y radio.
//
//   <Card title="Agregar género">
//     <GenreForm ... />
//   </Card>
import type { ReactNode, Ref } from 'react';
import './_card.scss';

type CardProps = {
  /** Título opcional de la tarjeta. Si no se pasa, no se dibuja la cabecera. */
  title?: string;
  subtitle?: string;
  /**
   * 'panel' es la tarjeta con su marco (fondo, borde y esquinas redondeadas).
   * 'plain' es la misma tarjeta sin marco, para cuando va ADENTRO de otra: dos
   * cajas del mismo color, una dentro de la otra, se ven como un error de
   * maquetado. Sin marco, el título y el espaciado alcanzan para separar el
   * bloque.
   */
  variant?: 'panel' | 'plain';
  children: ReactNode;
  /**
   * Referencia al elemento raíz. La usan las secciones de administración para
   * traer la vista hasta el formulario al apretar "Editar" en una fila de abajo.
   */
  ref?: Ref<HTMLElement>;
  className?: string;
};

export const Card = ({
  title,
  subtitle,
  variant = 'panel',
  children,
  ref,
  className = '',
}: CardProps) => {
  return (
    <section
      ref={ref}
      className={['card', `card--${variant}`, className].filter(Boolean).join(' ')}
    >
      {(title || subtitle) && (
        <header className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </header>
      )}

      {children}
    </section>
  );
};
