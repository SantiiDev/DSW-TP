// Sección de la página de exploración musical para descubrir álbumes por género.
//
// Es el listado de géneros de la aplicación: son once y entran todos en pantalla,
// así que no hace falta una página aparte para listarlos. Cada tarjeta lleva a la
// ficha del género (/genres/:id).
//
// Los datos salen de la API (`/api/genres`), que en las lecturas es pública: esta
// página se ve sin iniciar sesión y la grilla es de lo primero que mira alguien
// que todavía no tiene cuenta.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { Loader } from '../../../core/components/Loader';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { genreService } from '../../genre/services/genreService';
import type { Genre } from '../../genre/models/Genre';

// Paleta de las tarjetas. Es decoración, no un dato del negocio: se aplica por
// posición en el listado y se repite si algún día hay más géneros que degradados.
const GRADIENTS = [
  'linear-gradient(135deg, #e94560, #0f3460)',
  'linear-gradient(135deg, #f5a623, #e94560)',
  'linear-gradient(135deg, #48dbfb, #0abde3)',
  'linear-gradient(135deg, #c06c84, #6c5b7b)',
  'linear-gradient(135deg, #00cec9, #6c5ce7)',
  'linear-gradient(135deg, #fdcb6e, #e17055)',
  'linear-gradient(135deg, #2d3436, #636e72)',
  'linear-gradient(135deg, #a29bfe, #fd79a8)',
  'linear-gradient(135deg, #55a630, #80b918)',
  'linear-gradient(135deg, #b8860b, #daa520)',
  'linear-gradient(135deg, #ff6b6b, #ee5a24)',
  'linear-gradient(135deg, #1dd1a1, #10ac84)',
];

export const BrowseByGenreSection = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setGenres(await genreService.list());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    void loadGenres();
  }, []);

  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <Music2 size={22} className="explore-section__header-icon" />
          <h2 className="explore-section__title">Explorar por Género</h2>
        </div>
      </div>

      {isLoading ? (
        <Loader message="Cargando géneros..." />
      ) : error ? (
        <p className="genre-grid__error" role="alert">
          {error}
        </p>
      ) : genres.length === 0 ? (
        <p className="genre-grid__empty">Todavía no hay géneros cargados en el catálogo.</p>
      ) : (
        <div className="genre-grid">
          {genres.map((genre, index) => (
            <Link
              key={genre.id}
              to={`/genres/${genre.id}`}
              className="genre-card"
              style={{ background: GRADIENTS[index % GRADIENTS.length] }}
            >
              <span className="genre-card__name">{genre.name}</span>
              {/* Solo los álbumes aprobados: los aportes que todavía nadie revisó
                  no forman parte del catálogo público. */}
              <span className="genre-card__count">
                {genre.publicAlbumsCount === 1
                  ? '1 álbum'
                  : `${genre.publicAlbumsCount} álbumes`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
