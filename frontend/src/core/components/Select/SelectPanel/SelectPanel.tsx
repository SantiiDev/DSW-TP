// Panel de opciones del Select: el buscador (si lo hay) y la lista.
//
// Es solo el dibujo: qué opción está marcada, qué se escribió y qué pasa con el
// teclado lo decide Select, que es el que tiene el estado. Vive dentro de la
// carpeta de Select porque no tiene sentido suelto.
import { Check, Search } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, RefObject } from 'react';

/** Una opción del desplegable: el valor que viaja y el texto que se muestra. */
export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectPanelProps<T extends string | number> = {
  /** Id de la lista, para los atributos aria del botón y del buscador. */
  listId: string;
  panelRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<HTMLUListElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  /** Posición fija en la ventana (ver useFloatingPanel). */
  style: CSSProperties;
  /** Las opciones que pasan el filtro del buscador. */
  options: SelectOption<T>[];
  value: T;
  highlightedIndex: number;
  searchable: boolean;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSearchKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onHighlight: (index: number) => void;
  onSelect: (option: SelectOption<T>) => void;
};

export function SelectPanel<T extends string | number>({
  listId,
  panelRef,
  listRef,
  searchRef,
  style,
  options,
  value,
  highlightedIndex,
  searchable,
  searchPlaceholder,
  query,
  onQueryChange,
  onSearchKeyDown,
  onHighlight,
  onSelect,
}: SelectPanelProps<T>) {
  return (
    <div ref={panelRef} className="select__panel" style={style}>
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
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>
      )}

      <ul id={listId} ref={listRef} className="select__list" role="listbox">
        {options.map((option, index) => {
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
              // El click se resuelve en mousedown y no en click: el listener que
              // cierra al hacer click afuera también corre en mousedown.
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(option);
              }}
              onMouseEnter={() => onHighlight(index)}
            >
              <span className="select__option-label">{option.label}</span>
              {isSelected && <Check size={14} aria-hidden="true" />}
            </li>
          );
        })}

        {/* Con el buscador vacío esto no puede pasar: solo aparece cuando lo que
            se escribió no coincide con ninguna opción. */}
        {options.length === 0 && (
          <li className="select__empty">No hay resultados para "{query.trim()}".</li>
        )}
      </ul>
    </div>
  );
}
