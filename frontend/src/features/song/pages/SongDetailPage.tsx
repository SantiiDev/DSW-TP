// Ficha pública de una canción: su carátula (la del álbum), sus datos, su
// calificación promedio y sus reseñas.
//
// Es a donde llevan las filas del tracklist de un álbum, las tarjetas del
// explorador (/music) y las del listado. La ruta pide sesión (ver App.tsx).
//
// La API, en cambio, es pública y devuelve solo el catálogo aprobado: responde
// 404 sobre una canción que todavía no se revisó.
//
// Las reseñas las pone entera la feature review, con su propia sección: acá solo
// se le dice qué ítem mostrar y se le pasa el `reload` de la canción, para que su
// calificación promedio se actualice apenas alguien publique, edite o borre una.
import { Link, useParams } from 'react-router-dom';
import { BackLink } from '../../../core/components/BackLink';
import { Music } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useFetch } from '../../../core/hooks/useFetch';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { AlbumRating } from '../../album/components/AlbumRating';
import { ReviewsSection } from '../../review/components/ReviewsSection';
import { songService } from '../services/songService';
import '../styles/_song.scss';

export const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: song,
    isLoading,
    error,
    reload,
  } = useFetch(() => songService.getById(Number(id)), id);

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
              {/* Cada canción se califica por separado del álbum, por eso tiene
                  su propia sección y no alcanza con la del disco. Su promedio no
                  sale de una columna: lo calcula el backend al leer, así que
                  alcanza con volver a pedir la canción. */}
              <ReviewsSection targetKind="song" targetId={song.id} onReviewChange={reload} />
            </section>

            {/* Vuelve al lugar del que se vino: a una canción se llega desde el
                tracklist de su álbum, desde el explorador o desde un listado, y
                mandar siempre al álbum estaba mal en casi todos los casos. Si no
                hay historial, el álbum es el destino que más sentido tiene. */}
            <BackLink fallbackTo={song.album ? `/albums/${song.album.id}` : '/music'} />
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
