// Lista de barras horizontales: compara pocas categorías con nombres largos, que
// en barras verticales no entrarían (décadas, artistas, géneros).
//
//   <HorizontalBarList items={[{ id: '1980', label: 'Años 80', value: 12, valueLabel: '12' }]} />
import { useInView } from '../../hooks/useInView';
import './_charts.scss';

export type BarItem = {
  id: string;
  label: string;
  value: number;
  /** Texto a la derecha de la barra. */
  valueLabel: string;
};

type HorizontalBarListProps = {
  items: BarItem[];
  ariaLabel: string;
};

export const HorizontalBarList = ({ items, ariaLabel }: HorizontalBarListProps) => {
  const { ref, inView } = useInView<HTMLUListElement>();
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul ref={ref} className="bar-list" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <li key={item.id} className="bar-list__item">
          <div className="bar-list__header">
            <span className="bar-list__label">{item.label}</span>
            <span className="bar-list__value">{item.valueLabel}</span>
          </div>
          <div className="bar-list__track" aria-hidden="true">
            <span
              className="bar-list__fill"
              style={{
                // Crece desde la izquierda con scaleX, que se anima sin recalcular
                // el layout de la página (a diferencia de animar el width).
                transform: `scaleX(${inView ? item.value / max : 0})`,
                transitionDelay: `${index * 90}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};
