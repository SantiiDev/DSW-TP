// Conmutador de vista: la caja con las pastillas que cambian QUÉ se está mirando
// dentro de una misma página (álbumes o canciones en /music, comunidad o amigos
// en /reviews, qué entidad del catálogo en el panel de administración).
//
// Estaba escrito a mano en la página de música (music-explore__tabs) y vive acá
// para que todas las pantallas usen el mismo control y el mismo estilo.
//
// Se distingue de SegmentedControl: aquel es una fila de pastillas sueltas que
// FILTRA una lista (los estados de las solicitudes); este es el interruptor
// principal de la pantalla, con la opción activa en verde sobre una caja de
// fondo.
//
//   <ViewSwitcher
//     options={[{ value: 'albums', label: 'Álbumes' }]}
//     value={activeTab}
//     onChange={setActiveTab}
//     ariaLabel="Tipo de música"
//   />
import type { CSSProperties } from 'react';
import './_view-switcher.scss';

export type ViewOption<T extends string> = {
  value: T;
  label: string;
};

type ViewSwitcherProps<T extends string> = {
  options: readonly ViewOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Qué se está eligiendo, para el lector de pantalla. */
  ariaLabel: string;
  /**
   * Color de la caja de fondo:
   * - 'default': la de una página, sobre el fondo general del sitio.
   * - 'sunken':  más oscura, para cuando el conmutador va DENTRO de una tarjeta
   *   (el panel de administración). Con el color por defecto queda del mismo
   *   tono que la tarjeta y el control desaparece contra ella.
   *
   * Es una prop y no una clase que mande la feature porque el estilo base ya fija
   * el fondo: una clase de afuera con la misma especificidad ganaría o perdería
   * según el orden en que se carguen las hojas de estilo, que no es el mismo en
   * desarrollo que en el build. Es el mismo criterio que el `highlighted` de
   * Select.
   */
  tone?: 'default' | 'sunken';
};

export function ViewSwitcher<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tone = 'default',
}: ViewSwitcherProps<T>) {
  // Posición de la opción elegida dentro de la fila. Es lo único que necesita el
  // CSS para deslizar la pastilla verde hasta ella (ver _view-switcher.scss).
  // -1 si el valor no está entre las opciones: ahí no se dibuja ninguna.
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div
      className={`view-switcher${tone === 'sunken' ? ' view-switcher--sunken' : ''}`}
      role="group"
      aria-label={ariaLabel}
      // Las dos medidas van como variables CSS y no como estilos ya calculados:
      // el ancho de cada celda lo resuelve la grilla, y así el CSS puede correr
      // la pastilla con un porcentaje sin que el componente mida nada.
      style={
        {
          '--switcher-count': options.length,
          '--switcher-index': activeIndex,
        } as CSSProperties
      }
    >
      {/* La pastilla verde, una sola para todo el control: al cambiar de opción
          se desliza hasta la nueva en vez de apagarse acá y prenderse allá.
          Decorativa: cuál está elegida ya lo dice el aria-pressed de cada botón. */}
      {activeIndex >= 0 && <span className="view-switcher__thumb" aria-hidden="true" />}

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`view-switcher__option ${
            option.value === value ? 'view-switcher__option--active' : ''
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
