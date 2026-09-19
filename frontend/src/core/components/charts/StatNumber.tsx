// Número grande con su etiqueta, como los totales de un resumen anual.
//
//   <StatNumber value={1234} label="minutos" />
import './_charts.scss';

type StatNumberProps = {
  value: number;
  label: string;
  /** Decimales a mostrar (un promedio lleva uno o dos; un contador, ninguno). */
  decimals?: number;
  /** Tamaño del número: 'xl' para el dato estrella, 'md' para los secundarios. */
  size?: 'md' | 'xl';
};

export const StatNumber = ({ value, label, decimals = 0, size = 'md' }: StatNumberProps) => {
  const formatted = value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className={`stat-number stat-number--${size}`}>
      <span className="stat-number__value">{formatted}</span>
      <span className="stat-number__label">{label}</span>
    </div>
  );
};
