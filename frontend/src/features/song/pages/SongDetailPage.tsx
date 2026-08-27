// Ficha pública de una canción: su carátula (la del álbum), sus datos, su
// calificación promedio y sus reseñas.
//
// Es a donde lleva cada fila del tracklist de /albums/:id. Es una página pública,
// igual que esa: leer el catálogo aprobado no pide token, y por eso la API
// responde 404 sobre una canción que todavía no está aprobada.
//
// Las reseñas todavía no tienen endpoints (es la feature review), así que esa
// sección muestra su estado vacío definitivo. Cuando existan, se reemplaza el
// EmptyState por el listado paginado sin tocar el resto de la página.
import { Link, useParams } from 'react-router-dom';
import { Disc3, Music, Star } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useFetch } from '../../../core/hooks/useFetch';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { AlbumRating } from '../../album/components/AlbumRating';
import { songService } from '../services/songService';
import '../styles/_song.scss';

export const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: song, isLoading, error } = useFetch(() => songService.getById(Number(id)), id);

  return (
    <>
      <Navbar />

      <main className="song-detail">
        {isLoading ? (
          <Loader message="Cargando la canción..." />
        ) : error ? (
          <Alert tone="error">{error}</Alert>
        ) : song ? (
          <>
            <header className="song-detail__header">
              {/* La carátula es la del álbum: una canción no tiene portada propia. */}
              <AlbumCover
                title={song.album?.title ?? song.title}
                url={song.album?.urlCover ?? null}
                size="lg"
              />

              <div className="song-detail__info">
                <p className="song-detail__eyebrow">Canción</p>
                <h1 className="song-detail__title">{song.title}</h1>
                <p className="song-detail__artist">{song.artistName}</p>

                <p className="song-detail__meta">
                  {song.album ? (
                    <>
                      Pista {song.numberTrack} de{' '}
                      <Link to={`/albums/${song.album.id}`} className="song-detail__album-link">
                        {song.album.title}
                      </Link>{' '}
                      · {song.yearLabel} · {song.durationLabel}
                    </>
                  ) : (
                    // Las canciones sin álbum son filas viejas: la API ya no deja
                    // cargar ninguna.
                    <>Sin álbum · {song.durationLabel}</>
                  )}
                </p>

                <AlbumRating value={song.averageRating} count={song.reviewsCount} size="lg" />
              </div>
            </header>

            <section className="song-detail__section">
              <h2 className="song-detail__section-title">Reseñas</h2>

              {/* Placeholder hasta que exista el CRUD de reseñas: ahí va el
                  listado paginado de las reseñas de esta canción. Cada canción se
                  califica por separado del álbum, por eso tiene su propia
                  sección y no alcanza con la del disco. */}
              <EmptyState
                icon={<Star size={22} />}
                title="Todavía no hay reseñas de esta canción."
                message="Cuando la comunidad empiece a calificarla, las reseñas se van a listar acá de a tandas, con su puntaje y su texto."
              />
            </section>

            {/* Se vuelve al álbum, que es el listado del que vino. */}
            {song.album && (
              <Link to={`/albums/${song.album.id}`} className="song-detail__back">
                <Disc3 size={15} aria-hidden="true" />
                Volver a {song.album.title}
              </Link>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Music size={22} />}
            title="No encontramos esa canción."
            message="Puede que se haya dado de baja del catálogo o que el enlace esté mal."
          />
        )}
      </main>

      <Footer />
    </>
  );
};
