// Aviso al pasar: una línea discreta que confirma algo que acaba de salir bien
// ("Se agregó Kid A", "Se eliminó Mis favoritos").
//
// Se distingue del Alert: aquel es una caja con borde y color de fondo, para un
// error que hay que leer sí o sí. Esto se lee de reojo, no tiene nada que
// cerrar y quien lo muestra lo hace desaparecer solo a los pocos segundos.
//
//   <InlineNotice tone="positive" icon={<Check size={14} />}>
//     Se agregó <strong>Kid A</strong>
//   </InlineNotice>
import type { ReactNode } from 'react';
import './_inline-notice.scss';

type InlineNoticeProps = {
  /** 'positive' lo pinta del verde de la marca; 'neutral', del gris del texto secundario. */
  tone?: 'positive' | 'neutral';
  /** Ícono decorativo, normalmente uno de lucide-react. */
  icon?: ReactNode;
  children: ReactNode;
};

export const InlineNotice = ({ tone = 'neutral', icon, children }: InlineNoticeProps) => {
  return (
    // role="status" es lo que hace que un lector de pantalla lo anuncie sin
    // interrumpir lo que se esté leyendo. Sin eso, un aviso que aparece y se va
    // solo pasaría desapercibido para quien no lo ve.
    <p className={`inline-notice inline-notice--${tone}`} role="status">
      {icon && (
        <span className="inline-notice__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </p>
  );
};
