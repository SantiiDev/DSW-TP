// Panel de filtros de la ficha de un género: género y año de lanzamiento.
//
// Es presentacional: no filtra ni navega, avisa al padre (GenreDetailPage) con
// los handlers que recibe.
//
// El filtro de género no reduce la lista sino que cambia de página: estando en la
// ficha de "Rock" no tiene sentido filtrar por "Jazz", porque acá no hay álbumes
// de Jazz. Elegir otro lleva a la ficha de ese otro, que es lo que espera
// cualquiera al ver un desplegable de géneros.
import { X } from 'lucide-react';
import { Select } from '../../../core/components/Select';
import type { SelectOption } from '../../../core/components/Select';
import type { Genre } from '../models/Genre';
import '../styles/_genre.scss';

/**
 * Cómo se aplica el año elegido.
 * - 'exact': solo los álbumes de ese año.
 * - 'from':  ese año y todos los posteriores.
 */
export type YearMode = 'exact' | 'from';

// Valor de la opción "Todos" del filtro de año. El desplegable necesita un valor
// concreto para cada opción y el "sin filtro" es null, así que se representa con
// un 0, que nunca va a ser un año de lanzamiento real.
const ALL_YEARS = 0;

type GenreFiltersProps = {
  /** Todos los géneros, para poder saltar a otro. */
  genres: Genre[];
  currentGenreId: number;
  /** Años que existen entre los álbumes de este género. */
  availableYears: number[];
  /** Año elegido, o null si el filtro está en "Todos". */
  selectedYear: number | null;
  yearMode: YearMode;
  onGenreChange: (id: number) => void;
  onYearChange: (year: number | null) => void;
  onYearModeChange: (mode: YearMode) => void;
};

export const GenreFilters = ({
  genres,
  currentGenreId,
  availableYears,
  selectedYear,
  yearMode,
  onGenreChange,
  onYearChange,
  onYearModeChange,
}: GenreFiltersProps) => {
  // Las listas del desplegable se arman acá y no en el JSX para no mezclar la
  // preparación de los datos con el dibujo.
  const genreOptions: SelectOption<number>[] = genres.map((genre) => ({
    value: genre.id,
    label: genre.name,
  }));

  const yearOptions: SelectOption<number>[] = [
    { value: ALL_YEARS, label: 'Todos' },
    ...availableYears.map((year) => ({ value: year, label: String(year) })),
  ];

  return (
    <aside className="genre-filters" aria-label="Filtros">
      <h2 className="genre-filters__title">Filtros</h2>

      <div className="genre-filters__group">
        <label className="genre-filters__label" htmlFor="filter-genre">
          Género
        </label>
        <Select
          id="filter-genre"
          options={genreOptions}
          value={currentGenreId}
          onChange={onGenreChange}
          fullWidth
        />
      </div>

      <div className="genre-filters__group">
        <label className="genre-filters__label" htmlFor="filter-year">
          Año de lanzamiento
        </label>
        <Select
          id="filter-year"
          options={yearOptions}
          value={selectedYear ?? ALL_YEARS}
          // ALL_YEARS es la opción "Todos"; el resto son años de verdad.
          onChange={(year) => onYearChange(year === ALL_YEARS ? null : year)}
          fullWidth
        />

        {/* Los dos modos solo tienen sentido con un año elegido: sobre "Todos"
            no hay nada que acotar. */}
        {selectedYear !== null && (
          <div
            className="genre-filters__modes"
            role="group"
            aria-label="Cómo aplicar el año elegido"
          >
            <button
              type="button"
              className={`genre-filters__mode ${
                yearMode === 'exact' ? 'genre-filters__mode--active' : ''
              }`}
              aria-pressed={yearMode === 'exact'}
              onClick={() => onYearModeChange('exact')}
            >
              Solo {selectedYear}
            </button>
            <button
              type="button"
              className={`genre-filters__mode ${
                yearMode === 'from' ? 'genre-filters__mode--active' : ''
              }`}
              aria-pressed={yearMode === 'from'}
              onClick={() => onYearModeChange('from')}
            >
              Desde {selectedYear}
            </button>
          </div>
        )}

        {selectedYear !== null && (
          <button
            type="button"
            className="genre-filters__clear"
            onClick={() => onYearChange(null)}
          >
            <X size={14} aria-hidden="true" />
            Quitar el filtro de año
          </button>
        )}
      </div>
    </aside>
  );
};
