// Gráfico de dona: cómo se reparte un total entre categorías (por ejemplo, los
// géneros de lo que alguien escucha). Las porciones se dibujan una detrás de otra
// y, al pasar por una porción o por su fila de la leyenda, se resaltan las dos.
//
//   <DonutChart segments={[{ label: 'Rock', value: 40 }]} centerValue="12" centerLabel="géneros" />
import { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { CHART_PALETTE } from './chartPalette';
import './_charts.scss';

export type DonutSegment = {
  label: string;
  value: number;
  /** Color propio; si no viene, se toma de la paleta por orden. */
  color?: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  /** Lo que se lee en el centro de la dona. */
  centerValue: string;
  centerLabel: string;
  /** Texto de cada fila de la leyenda a la derecha del nombre (por ejemplo, "35%"). */
  formatValue: (segment: DonutSegment, share: number) => string;
  ariaLabel: string;
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Separación entre porciones, en unidades del trazo. */
const GAP = 1.2;

export const DonutChart = ({
  segments,
  centerValue,
  centerLabel,
  formatValue,
  ariaLabel,
}: DonutChartProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  const arcs = segments.map((segment, index) => {
    const share = total === 0 ? 0 : segment.value / total;
    // Cada porción arranca donde terminó la anterior: su desplazamiento es la
    // suma de lo que ocupan todas las de antes.
    const previous = segments.slice(0, index).reduce((sum, item) => sum + item.value, 0);

    return {
      segment,
      share,
      color: segment.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
      // Con una sola porción no hace falta el hueco: sería una dona cortada.
      dash: Math.max(share * CIRCUMFERENCE - (segments.length > 1 ? GAP : 0), 0),
      offset: total === 0 ? 0 : (previous / total) * CIRCUMFERENCE,
    };
  });

  return (
    <div ref={ref} className="donut-chart" role="img" aria-label={ariaLabel}>
      <div className="donut-chart__ring">
        <svg viewBox="0 0 100 100" className="donut-chart__svg" aria-hidden="true">
          <circle className="donut-chart__track" cx="50" cy="50" r={RADIUS} />
          {arcs.map((arc, index) => (
            <circle
              key={arc.segment.label}
              className={`donut-chart__arc ${
                activeIndex !== null && activeIndex !== index ? 'donut-chart__arc--dimmed' : ''
              } ${activeIndex === index ? 'donut-chart__arc--active' : ''}`}
              cx="50"
              cy="50"
              r={RADIUS}
              stroke={arc.color}
              // Antes de verse, cada porción mide cero; al entrar en pantalla la
              // transición de CSS la estira hasta su largo real.
              strokeDasharray={`${inView ? arc.dash : 0} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
              style={{ transitionDelay: `${index * 120}ms` }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            />
          ))}
        </svg>

        <div className="donut-chart__center" aria-hidden="true">
          <span className="donut-chart__center-value">
            {activeIndex === null
              ? centerValue
              : `${Math.round(arcs[activeIndex].share * 100)}%`}
          </span>
          <span className="donut-chart__center-label">
            {activeIndex === null ? centerLabel : arcs[activeIndex].segment.label}
          </span>
        </div>
      </div>

      <ul className="donut-chart__legend">
        {arcs.map((arc, index) => (
          <li
            key={arc.segment.label}
            className={`donut-chart__legend-item ${
              activeIndex !== null && activeIndex !== index ? 'donut-chart__legend-item--dimmed' : ''
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span className="donut-chart__swatch" style={{ backgroundColor: arc.color }} />
            <span className="donut-chart__legend-label">{arc.segment.label}</span>
            <span className="donut-chart__legend-value">{formatValue(arc.segment, arc.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
