// Barra de contadores de una ficha: números grandes con su etiqueta debajo,
// repartidos en columnas separadas por una línea.
//
// Es el bloque que va debajo de la portada en la ficha de un álbum y en la de una
// canción ("Reseñas", "Calificación", "Canciones"). Vive en core y no en una
// feature porque las dos fichas dibujan exactamente lo mismo.
//
//   <StatsBar items={[{ value: 12, label: 'Reseñas' }]} />
import type { ReactNode } from 'react';
import './_stats-bar.scss';

/** Una columna de la barra. */
export type Stat = {
  /** Lo destacado: un número, o un número con su ícono al lado. */
  value: ReactNode;
  /** Qué mide ese número. Se usa además como key de la lista. */
  label: string;
  /** Sufijo chico al lado del número, como el "/ 5" de una calificación. */
  unit?: string;
};

type StatsBarProps = {
  items: Stat[];
};

export const StatsBar = ({ items }: StatsBarProps) => {
  return (
    <ul className="stats-bar">
      {items.map((item) => (
        <li key={item.label} className="stats-bar__item">
          <span className="stats-bar__value">
            {item.value}
            {item.unit && <span className="stats-bar__unit">{item.unit}</span>}
          </span>
          <span className="stats-bar__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
};
