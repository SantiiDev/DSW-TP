// Gráfico de área con línea suavizada: la evolución de un valor a lo largo de una
// serie de períodos (por ejemplo, reseñas por mes).
//
//   <AreaLineChart points={[{ label: 'Ene', value: 3 }, ...]} formatValue={(v) => `${v} reseñas`} />
//
// El dibujo va en SVG estirado al ancho del contenedor. Lo que no se puede estirar
// sin deformarse (los puntos, las etiquetas y el globo con el valor) va en HTML
// encima, ubicado con porcentajes.
import { useId, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import './_charts.scss';

export type ChartPoint = {
  label: string;
  value: number;
};

type AreaLineChartProps = {
  points: ChartPoint[];
  /** Texto del globo al pasar por un punto. */
  formatValue: (value: number) => string;
  /** Descripción del gráfico para el lector de pantalla. */
  ariaLabel: string;
};

/** Sistema de coordenadas del SVG. El alto real lo define el CSS. */
const WIDTH = 100;
const HEIGHT = 100;
/** Aire arriba del punto más alto, para que la curva no toque el borde. */
const TOP_PADDING = 12;

/**
 * Arma la curva que pasa por todos los puntos.
 *
 * Cada tramo es una curva de Bézier cuyos dos puntos de control están a mitad de
 * camino en x y a la altura de cada extremo. Así la línea sale y llega horizontal
 * a cada punto: queda suave y nunca se pasa por arriba del máximo ni por debajo
 * de cero, cosa que sí pasa con otras interpolaciones.
 *
 * @param coords puntos ya convertidos a coordenadas del SVG.
 * @returns el atributo `d` del path.
 */
function buildSmoothPath(coords: { x: number; y: number }[]): string {
  return coords.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = coords[index - 1];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

export const AreaLineChart = ({ points, formatValue, ariaLabel }: AreaLineChartProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // El id del degradado tiene que ser único: puede haber dos gráficos en la página.
  const gradientId = useId();

  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? WIDTH / (points.length - 1) : 0;

  const coords = points.map((point, index) => ({
    x: index * step,
    y: HEIGHT - (point.value / max) * (HEIGHT - TOP_PADDING),
  }));

  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

  return (
    <div
      ref={ref}
      className={`area-chart ${inView ? 'area-chart--visible' : ''}`}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="area-chart__plot">
        {/* Líneas guía al 100%, 50% y 0% del máximo. */}
        <div className="area-chart__grid" aria-hidden="true">
          <span className="area-chart__grid-line" data-value={max} />
          <span className="area-chart__grid-line" data-value={Math.round(max / 2)} />
          <span className="area-chart__grid-line" data-value={0} />
        </div>

        <svg
          className="area-chart__svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="area-chart__area" d={areaPath} fill={`url(#${gradientId})`} />
          {/* non-scaling-stroke: sin esto el SVG estirado engordaría la línea. */}
          <path className="area-chart__line" d={linePath} vectorEffect="non-scaling-stroke" />
        </svg>

        {points.map((point, index) => (
          <button
            key={point.label}
            type="button"
            className={`area-chart__dot ${point.value === 0 ? 'area-chart__dot--zero' : ''} ${
              activeIndex === index ? 'area-chart__dot--active' : ''
            }`}
            style={{
              left: `${(coords[index].x / WIDTH) * 100}%`,
              top: `${(coords[index].y / HEIGHT) * 100}%`,
              // Los puntos aparecen de izquierda a derecha, detrás de la línea.
              transitionDelay: inView ? `${300 + index * 60}ms` : '0ms',
            }}
            aria-label={`${point.label}: ${formatValue(point.value)}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            {activeIndex === index && (
              <span className="area-chart__tooltip">
                <strong>{point.label}</strong>
                {formatValue(point.value)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="area-chart__labels" aria-hidden="true">
        {points.map((point, index) => (
          <span
            key={point.label}
            className={`area-chart__label ${activeIndex === index ? 'area-chart__label--active' : ''}`}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};
