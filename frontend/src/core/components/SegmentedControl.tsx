// Selector de segmentos: la fila de pastillas para elegir una variante dentro de
// una misma pantalla (las entidades del catálogo, los estados de las solicitudes).
//
// Se distingue a propósito de Tabs: las pestañas cambian de sección del panel,
// esto filtra el contenido de la sección en la que ya se está. Estaba escrito dos
// veces, una en cada pestaña del panel de administración.
//
//   <SegmentedControl
//     options={[{ value: 'pending', label: 'Pendientes' }]}
//     value={filter}
//     onChange={setFilter}
//     ariaLabel="Estado de la solicitud"
//   />
import './_segmented-control.scss';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Qué se está eligiendo, para el lector de pantalla. */
  ariaLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented__option ${
            option.value === value ? 'segmented__option--active' : ''
          }`}
          // aria-pressed es lo que le dice al lector de pantalla cuál está
          // elegido: visualmente se ve por el color, pero eso no se anuncia.
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
