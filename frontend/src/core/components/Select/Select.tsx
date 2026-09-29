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
//
// Con `searchable` suma un buscador arriba de la lista, para las listas largas
// donde bajar hasta la opción a mano es impracticable (los 263 álbumes del
// formulario de canción, los 89 artistas del de álbum):
//
//   <Select options={albumes} value={id} onChange={setId} searchable />
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
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
  /**
   * Resalta el control en verde. Lo usa la tabla de usuarios para marcar un rol
   * elegido y todavía sin guardar.
   *
   * Es una prop y no una clase que mande la feature porque el estilo base ya fija
   * el borde: una clase de afuera con la misma especificidad ganaría o perdería
   * según el orden en que se carguen las hojas de estilo, que no es el mismo en
   * desarrollo que en el build.
   */
  highlighted?: boolean;
  /** Estira el control al ancho del contenedor (formularios, filtros en columna). */
  fullWidth?: boolean;
  /**
   * Suma un campo de búsqueda arriba de la lista, que la filtra a medida que se
   * escribe. Se activa solo en las listas largas: con cuatro opciones el buscador
   * es un estorbo.
   */
  searchable?: boolean;
  /** Texto de ayuda del buscador. Solo se usa con `searchable`. */
  searchPlaceholder?: string;
  /** Clases extra para el botón, por si una feature necesita destacarlo. */
  className?: string;
};

// Alto máximo del panel (la lista más, si lo hay, el buscador). Se usa para
// decidir si abrirlo hacia abajo o hacia arriba según el espacio que quede en
// pantalla, así que alcanza con que sea una estimación del alto real.
const MAX_PANEL_HEIGHT = 300;

// Separación entre el botón y el panel.
const PANEL_GAP = 4;

// Ancho máximo del panel (tiene que coincidir con el max-width del CSS). Se usa
// para que, cuando el panel crece más que el botón, no se salga de la pantalla.
const MAX_PANEL_WIDTH = 320;

// Aire mínimo contra el borde de la ventana.
const VIEWPORT_MARGIN = 8;

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
  /**
   * El panel arranca del ancho del botón, pero crece si alguna opción no entra:
   * las opciones tienen que poder leerse enteras aunque el botón sea angosto.
   * El techo lo pone MAX_PANEL_WIDTH.
   */
  minWidth: number;
  /** Se usa uno u otro según hacia dónde se abra. */
  top?: number;
  bottom?: number;
};

/**
 * Normaliza un texto para poder buscarlo: minúsculas y sin acentos, así "Bailá"
 * se encuentra escribiendo "baila".
 *
 * NFD separa cada letra acentuada en letra + acento aparte ("á" pasa a ser "a" +
 * tilde), y el filtro siguiente borra ese acento suelto.
 */
function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      // \p{Diacritic} son justamente esos acentos sueltos. Se usa la clase
      // Unicode y no el rango de caracteres literales, que en el editor se ven
      // como espacios y cualquiera los borraría sin querer.
      .replace(/\p{Diacritic}/gu, '')
  );
}

export function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  id,
  ariaLabel,
  size = 'md',
  highlighted = false,
  fullWidth = false,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  className = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  // Opción marcada con el teclado. Es distinta de la elegida: recorrer la lista
  // con las flechas no cambia el valor hasta apretar Enter.
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  // Lo que se escribió en el buscador. Se vacía cada vez que se abre el panel:
  // el filtro de la vez anterior no tiene por qué seguir aplicado.
  const [query, setQuery] = useState('');

  const triggerRef = useRef<HTMLButtonElement>(null);
  // El panel entero (buscador + lista): es el que decide si un click fue adentro.
  const panelRef = useRef<HTMLDivElement>(null);
  // Solo la lista: es sobre la que se calcula qué opción traer a la vista.
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Ids únicos por instancia: puede haber varios Select en la misma pantalla
  // (la tabla de usuarios dibuja uno por fila).
  const listId = useId();

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;

  // Las opciones que se están mostrando. Sin buscador (o con el campo vacío) son
  // todas, así que el resto del componente trabaja siempre contra esta lista y no
  // le importa si hay filtro o no.
  const visibleOptions = useMemo(() => {
    if (!searchable || query.trim() === '') return options;

    const term = normalize(query.trim());
    return options.filter((option) => normalize(option.label).includes(term));
  }, [options, query, searchable]);

  /** Calcula dónde dibujar el panel a partir de la posición del botón en pantalla. */
  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Si abajo no entra pero arriba sí, se abre hacia arriba (típico de las
    // últimas filas de una tabla larga).
    const opensUpwards = spaceBelow < MAX_PANEL_HEIGHT && rect.top > spaceBelow;

    // El panel puede terminar más ancho que el botón, así que se corre a la
    // izquierda si con ese ancho llegaría a pasarse del borde de la ventana.
    const maxLeft = window.innerWidth - MAX_PANEL_WIDTH - VIEWPORT_MARGIN;

    setPosition({
      left: Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft)),
      minWidth: rect.width,
      ...(opensUpwards
        ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
        : { top: rect.bottom + PANEL_GAP }),
    });
  };

  const openPanel = () => {
    if (disabled) return;
    setQuery('');
    // Arranca marcada la opción actual, para que las flechas sigan desde ahí.
    const selectedIndex = options.findIndex((option) => option.value === value);
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

  // Con buscador, el foco pasa al campo apenas se abre: se puede escribir sin
  // tener que hacerle click primero.
  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  // Mantiene visible la opción marcada al recorrer una lista larga con el teclado.
  useEffect(() => {
    if (!isOpen) return;
    const option = listRef.current?.children[highlightedIndex];
    option?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  /**
   * Recorre las opciones con el teclado y confirma o cancela.
   *
   * La comparten el botón y el campo de búsqueda: con buscador el foco está en el
   * campo, así que las flechas y el Enter llegan por ahí y no por el botón.
   *
   * @param e evento de teclado.
   * @returns true si consumió la tecla; con false, quien llama sigue con lo suyo.
   */
  const handleListKeys = (e: React.KeyboardEvent): boolean => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((current) =>
          visibleOptions.length === 0 ? 0 : (current + 1) % visibleOptions.length
        );
        return true;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((current) =>
          visibleOptions.length === 0
            ? 0
            : (current - 1 + visibleOptions.length) % visibleOptions.length
        );
        return true;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        return true;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(Math.max(0, visibleOptions.length - 1));
        return true;
      case 'Enter':
        e.preventDefault();
        if (visibleOptions[highlightedIndex]) handleSelect(visibleOptions[highlightedIndex]);
        return true;
      default:
        return false;
    }
  };

  /** Teclado sobre el botón: abre, recorre las opciones y confirma o cancela. */
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Tab tiene que seguir moviendo el foco: solo se cierra el panel.
    if (e.key === 'Tab' || e.key === 'Escape') {
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

    // La barra espaciadora elige la opción marcada, igual que Enter. Con buscador
    // no llega hasta acá: ahí el espacio es un carácter más de la búsqueda.
    if (e.key === ' ') {
      e.preventDefault();
      if (visibleOptions[highlightedIndex]) handleSelect(visibleOptions[highlightedIndex]);
      return;
    }

    handleListKeys(e);
  };

  /** Teclado sobre el buscador: lo mismo, pero Escape vuelve el foco al botón. */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      closePanel();
      if (e.key === 'Escape') triggerRef.current?.focus();
      return;
    }

    handleListKeys(e);
  };

  const wrapperClass = ['select', fullWidth ? 'select--full' : ''].filter(Boolean).join(' ');

  const triggerClass = [
    'select__trigger',
    `select__trigger--${size}`,
    isOpen ? 'select__trigger--open' : '',
    highlighted ? 'select__trigger--highlighted' : '',
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
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen ? `${listId}-option-${highlightedIndex}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (isOpen ? closePanel() : openPanel())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="select__value">{selectedLabel}</span>
        <ChevronDown className="select__icon" size={16} aria-hidden="true" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div ref={panelRef} className="select__panel" style={position}>
            {searchable && (
              <div className="select__search">
                <Search className="select__search-icon" size={15} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="text"
                  className="select__search-input"
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={`${listId}-option-${highlightedIndex}`}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    // El filtro cambia la lista entera: la marca vuelve al primer
                    // resultado, que si no quedaría apuntando a cualquier lado.
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            )}

            <ul id={listId} ref={listRef} className="select__list" role="listbox">
              {visibleOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    id={`${listId}-option-${index}`}
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

              {/* Con el buscador vacío esto no puede pasar: solo aparece cuando lo
                  que se escribió no coincide con ninguna opción. */}
              {visibleOptions.length === 0 && (
                <li className="select__empty">No hay resultados para "{query.trim()}".</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
