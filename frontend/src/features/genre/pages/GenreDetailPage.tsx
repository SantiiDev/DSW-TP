// Ficha pública de un género: su nombre y los álbumes del catálogo que lo tienen
// asignado. Es a donde llevan las tarjetas de "Explorar por Género" en /music.
//
// El listado de géneros no vive acá sino en esa grilla del explorador: son once y
// entran todos en pantalla, así que una página aparte solo para listarlos
// duplicaría lo mismo.
//
// Es una página pública, igual que el explorador: leer géneros no pide token.
import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { genreService } from '../services/genreService';
import type { Genre } from '../models/Genre';
import '../styles/_genre.scss';

export const GenreDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [genre, setGenre] = useState<Genre | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGenre = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setGenre(await genreService.getById(Number(id)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGenre();
  }, [loadGenre]);

  // Solo los álbumes aprobados: los que un usuario PRO propuso y todavía nadie
  // revisó no forman parte del catálogo público.
  const albums = genre?.publicAlbums ?? [];

  return (
    <>
      <Navbar />

      <main className="genre-detail">
        {isLoading ? (
          <Loader message="Cargando el género..." />
        ) : error ? (
          <p className="genre-detail__error" role="alert">
            {error}
          </p>
        ) : genre ? (
          <>
            <header className="genre-detail__header">
              <p className="genre-detail__eyebrow">Género</p>
              <h1 className="genre-detail__title">{genre.name}</h1>
              <p className="genre-detail__count">
                {albums.length === 1
                  ? '1 álbum en el catálogo'
                  : `${albums.length} álbumes en el catálogo`}
              </p>
            </header>

            {albums.length === 0 ? (
              <EmptyState
                icon={<Disc3 size={22} />}
                title={`Todavía no hay álbumes de ${genre.name}.`}
                message="Cuando se carguen álbumes con este género, van a aparecer acá."
              />
            ) : (
              // Por ahora es una lista de títulos: la ficha de álbum llega con el
              // CRUD de álbum, y ahí cada título pasa a ser un link a su detalle.
              <ul className="genre-detail__albums">
                {albums.map((album) => (
                  <li key={album.id} className="genre-detail__album">
                    {album.title}
                  </li>
                ))}
              </ul>
            )}

            <Link to="/music" className="genre-detail__back">
              Volver a explorar música
            </Link>
          </>
        ) : null}
      </main>

      <Footer />
    </>
  );
};
