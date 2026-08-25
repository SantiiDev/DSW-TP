// Desplegable propio del sitio.
//
// Reemplaza al <select> nativo: su panel de opciones lo dibuja el sistema
// operativo (fondo blanco, tipografía del SO, bordes cuadrados) y no se puede
// estilar con CSS, así que en un sitio oscuro como este desentona apenas se lo
// abre. Acá el panel es HTML propio y usa los mismos colores que el resto.
//
// Tiene el mismo contrato que un select controlado: recibe las opciones y el
// valor elegido (input properties) y avisa del cambio con onChange (output
// property). El estado de "abierto" es interno, porque no le importa a nadie más.
//
//   <Select
//     options={[{ value: 'FREE', label: 'Member' }]}
//     value={rol}
//     onChange={(nuevoRol) => setRol(nuevoRol)}
//   />
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './_select.scss';

/** Una opción del desplegable: el valor que viaja y el texto que se muestra. */
export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectProps<T extends string | number> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Texto a mostrar si el valor actual no coincide con ninguna opción. */
  placeholder?: string;
  disabled?: boolean;
  /** Id del botón, para poder asociarlo a un <label htmlFor>. */
  id?: string;
  /** Nombre accesible cuando no hay un <label> visible al lado. */
  ariaLabel?: string;
  /** 'sm' para tablas y barras de filtros, 'md' para formularios. */
  size?: 'sm' | 'md';
  /** Estira el control al ancho del contenedor (formularios, filtros en columna). */
  fullWidth?: boolean;
  /** Clases extra para el botón, por si una feature necesita destacarlo. */
  className?: string;
};

// Alto máximo del panel (coincide con el max-height del CSS). Se usa para decidir
// si abrirlo hacia abajo o hacia arriba según el espacio que quede en pantalla.
const MAX_PANEL_HEIGHT = 260;

// Separación entre el botón y el panel.
const PANEL_GAP = 4;

/**
 * Posición del panel en la ventana.
 *
 * Es `position: fixed` y va montado en el <body> con un portal, no dentro del
 * componente. Si fuera un hijo con position:absolute, cualquier contenedor con
 * overflow (por ejemplo el wrapper con scroll de la tabla de usuarios) le
 * recortaría el panel al abrirlo.
 */
type PanelPosition = {
  left: number;
  width: number;
  /** Se usa uno u otro según hacia dónde se abra. */
  top?: number;
  bottom?: number;
};

export function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  id,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  className = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  // Opción marcada con el teclado. Es distinta de la elegida: recorrer la lista
  // con las flechas no cambia el valor hasta apretar Enter.
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  // Ids únicos por instancia: puede haber varios Select en la misma pantalla
  // (la tabla de usuarios dibuja uno por fila).
  const panelId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

  /** Calcula dónde dibujar el panel a partir de la posición del botón en pantalla. */
  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Si abajo no entra pero arriba sí, se abre hacia arriba (típico de las
    // últimas filas de una tabla larga).
    const opensUpwards = spaceBelow < MAX_PANEL_HEIGHT && rect.top > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      ...(opensUpwards
        ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
        : { top: rect.bottom + PANEL_GAP }),
    });
  };

  const openPanel = () => {
    if (disabled) return;
    // Arranca marcada la opción actual, para que las flechas sigan desde ahí.
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    updatePosition();
    setIsOpen(true);
  };

  const closePanel = () => setIsOpen(false);

  const handleSelect = (option: SelectOption<T>) => {
    onChange(option.value);
    closePanel();
    // Devuelve el foco al botón: si no, al cerrarse el panel el foco se pierde y
    // el tabulado tendría que arrancar de nuevo desde el principio de la página.
    triggerRef.current?.focus();
  };

  // Un click fuera del control cierra el panel, como cualquier desplegable.
  // El listener se engancha solo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closePanel();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  // El panel está en el <body> con position: fixed, así que no acompaña solo al
  // botón cuando la página (o la tabla) scrollea: hay que recalcularlo.
  // El `true` es la fase de captura, para enterarse también del scroll de los
  // contenedores internos, que no burbujea.
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Mantiene visible la opción marcada al recorrer una lista larga con el teclado.
  useEffect(() => {
    if (!isOpen) return;
    const option = panelRef.current?.children[highlightedIndex];
    option?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  /** Teclado sobre el botón: abre, recorre las opciones y confirma o cancela. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Tab tiene que seguir moviendo el foco: solo se cierra el panel.
    if (e.key === 'Tab') {
      closePanel();
      return;
    }

    if (e.key === 'Escape') {
      closePanel();
      return;
    }

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openPanel();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((current) => (current + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((current) => (current - 1 + options.length) % options.length);
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[highlightedIndex]) handleSelect(options[highlightedIndex]);
        break;
      default:
        break;
    }
  };

  const wrapperClass = ['select', fullWidth ? 'select--full' : ''].filter(Boolean).join(' ');

  const triggerClass = [
    'select__trigger',
    `select__trigger--${size}`,
    isOpen ? 'select__trigger--open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={triggerClass}
        disabled={disabled}
        // Le cuentan al lector de pantalla que esto abre una lista de opciones y
        // cuál está marcada, que es lo que el <select> nativo hace por su cuenta.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-activedescendant={isOpen ? `${panelId}-option-${highlightedIndex}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (isOpen ? closePanel() : openPanel())}
        onKeyDown={handleKeyDown}
      >
        <span className="select__value">{selectedLabel}</span>
        <ChevronDown className="select__icon" size={16} aria-hidden="true" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <ul
            id={panelId}
            ref={panelRef}
            className="select__panel"
            role="listbox"
            style={position}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={option.value}
                  id={`${panelId}-option-${index}`}
                  className={[
                    'select__option',
                    isHighlighted ? 'select__option--highlighted' : '',
                    isSelected ? 'select__option--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="option"
                  aria-selected={isSelected}
                  // El click se resuelve en mousedown y no en click: el listener
                  // que cierra al hacer click afuera también corre en mousedown.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="select__option-label">{option.label}</span>
                  {isSelected && <Check size={14} aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
