// Número grande que cuenta desde cero hasta su valor al entrar en pantalla, como
// los totales de un resumen anual.
//
//   <StatNumber value={1234} label="minutos" />
//   <StatNumber value={35000} label="cobrados" prefix="$ " />
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
  /** Texto pegado adelante del número, que no se anima (por ejemplo "$ "). */
  prefix?: string;
  /** Texto pegado atrás del número (por ejemplo "%"). */
  suffix?: string;
};

/** Cuánto dura el conteo, en milisegundos. */
const DURATION_MS = 1200;

/** Desacelera al final: arranca rápido y se asienta suave sobre el valor. */
function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export const StatNumber = ({
  value,
  label,
  decimals = 0,
  size = 'md',
  prefix = '',
  suffix = '',
}: StatNumberProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;

    // El conteo corre siempre, aunque el sistema pida reducir movimiento: fue
    // una decisión del equipo.
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
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
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="stat-number__sr">
        {prefix}
        {value.toLocaleString('es-AR', { maximumFractionDigits: decimals })}
        {suffix}
      </span>
      <span className="stat-number__label">{label}</span>
    </div>
  );
};
