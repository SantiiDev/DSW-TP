// Número grande que cuenta desde cero hasta su valor al entrar en pantalla, como
// los totales de un resumen anual.
//
//   <StatNumber value={1234} label="minutos" />
import { useEffect, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import './_charts.scss';

type StatNumberProps = {
  value: number;
  label: string;
  /** Decimales a mostrar (un promedio lleva uno o dos; un contador, ninguno). */
  decimals?: number;
  /** Tamaño del número: 'xl' para el dato estrella, 'md' para los secundarios. */
  size?: 'md' | 'xl';
};

/** Cuánto dura el conteo, en milisegundos. */
const DURATION_MS = 1200;

/** Desacelera al final: arranca rápido y se asienta suave sobre el valor. */
function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export const StatNumber = ({ value, label, decimals = 0, size = 'md' }: StatNumberProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;

    // Quien pidió menos movimiento en su sistema ve el número final de una.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = prefersReducedMotion ? 1 : Math.min((now - start) / DURATION_MS, 1);
      setDisplayed(value * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  const formatted = displayed.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div ref={ref} className={`stat-number stat-number--${size}`}>
      {/* El lector de pantalla lee el valor final, no cada paso del conteo. */}
      <span className="stat-number__value" aria-hidden="true">
        {formatted}
      </span>
      <span className="stat-number__sr">
        {value.toLocaleString('es-AR', { maximumFractionDigits: decimals })}
      </span>
      <span className="stat-number__label">{label}</span>
    </div>
  );
};
