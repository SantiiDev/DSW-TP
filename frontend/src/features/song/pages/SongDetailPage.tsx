// Ficha pública de una canción: la cabecera con la carátula de su álbum y sus
// contadores, su ficha técnica, sus reseñas y el tracklist del disco al costado.
//
// Es a donde llevan las filas del tracklist de un álbum, las tarjetas del
// explorador (/music) y las del listado. La ruta pide sesión (ver App.tsx).
//
// La API de la canción, en cambio, es pública y devuelve solo el catálogo
// aprobado: responde 404 sobre una canción que todavía no se revisó.
//
// El layout es de dos columnas desde LG (igual que el perfil): la ficha técnica y
// las reseñas a la izquierda, el tracklist del álbum a la derecha. Una canción se
// entiende dentro de su disco, así que tener las otras pistas siempre a la vista
// es lo que más ayuda acá; la ficha de álbum, que no tiene ese contexto que
// mostrar, usa una sola columna.
//
// Las reseñas las pone entera la feature review, con su propia sección: acá solo
// se le dice qué ítem mostrar y se le pasa el `reload` de la canción, para que su
// calificación promedio se actualice apenas alguien publique, edite o borre una.
import { useParams } from 'react-router-dom';
import { Music } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { BackLink } from '../../../core/components/BackLink';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useFetch } from '../../../core/hooks/useFetch';
import { ReviewsSection } from '../../review/components/ReviewsSection';
import { songService } from '../services/songService';
import { SongAlbumTracklist } from '../components/SongAlbumTracklist';
import { SongHero } from '../components/SongHero';
import { SongInfoPanel } from '../components/SongInfoPanel';
import { SongTrackNav } from '../components/SongTrackNav';
import '../styles/_song.scss';

export const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: song,
    isLoading,
    error,
    reload,
  } = useFetch(() => songService.getById(Number(id)), id);

  // El tracklist del álbum se pide UNA sola vez y lo comparten la columna
  // lateral y la navegación anterior/siguiente. Mientras la canción no llegó
  // todavía no se sabe de qué álbum pedirlo, así que se devuelve una lista vacía
  // sin llamar a la API; cuando llega, cambia la clave y la carga se dispara.
  const albumId = song?.album?.id ?? null;

  const {
    data: tracks,
    isLoading: areTracksLoading,
    error: tracksError,
  } = useFetch(
    () => (albumId === null ? Promise.resolve([]) : songService.list({ idAlbum: albumId })),
    albumId ?? ''
  );

  // Las pistas vienen ordenadas por número de pista, así que la anterior y la
  // siguiente son las vecinas de esta en la lista.
  const trackList = tracks ?? [];
  const currentIndex = trackList.findIndex((track) => track.id === song?.id);
  const previous = currentIndex > 0 ? trackList[currentIndex - 1] : null;
  const next =
    currentIndex !== -1 && currentIndex < trackList.length - 1
      ? trackList[currentIndex + 1]
      : null;

  return (
    <>
      <Navbar />

      <main className="song-detail">
        {isLoading ? (
          <div className="song-detail__state">
            <Loader message="Cargando la canción..." />
          </div>
        ) : error ? (
          <div className="song-detail__state">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : song ? (
          <>
            {/* Vuelve al lugar del que se vino: a una canción se llega desde el
                tracklist de su álbum, desde el explorador o desde un listado, y
                mandar siempre al álbum estaba mal en casi todos los casos. Si no
                hay historial, el álbum es el destino que más sentido tiene. */}
            <div className="song-detail__topbar">
              <BackLink fallbackTo={song.album ? `/albums/${song.album.id}` : '/music'} />
            </div>

            <SongHero song={song} />

            <div className="song-detail__body">
              <div className="song-detail__main">
                <SongInfoPanel song={song} />

                {/* Cada canción se califica por separado del álbum, por eso tiene
                    su propia sección y no alcanza con la del disco. Su promedio no
                    sale de una columna: lo calcula el backend al leer, así que
                    alcanza con volver a pedir la canción. */}
                <ReviewsSection targetKind="song" targetId={song.id} onReviewChange={reload} />

                <SongTrackNav previous={previous} next={next} />
              </div>

              {song.album && (
                <aside className="song-detail__aside">
                  <SongAlbumTracklist
                    tracks={trackList}
                    currentSongId={song.id}
                    albumId={song.album.id}
                    isLoading={areTracksLoading}
                    error={tracksError}
                  />
                </aside>
              )}
            </div>
          </>
        ) : (
          <div className="song-detail__state">
            <EmptyState
              icon={<Music size={22} />}
              title="No encontramos esa canción."
              message="Puede que se haya dado de baja del catálogo o que el enlace esté mal."
            />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};
