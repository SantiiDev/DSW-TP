// Ficha pública de un álbum: la cabecera con su portada y sus contadores, la
// barra de secciones, el tracklist con la calificación de cada canción, las
// reseñas del álbum, la discografía del artista y, al costado, las acciones y la
// ficha técnica del disco.
//
// Es a donde llevan las tarjetas de álbum de la ficha de un género, las del
// explorador (/music) y las del listado. La ruta pide sesión (ver App.tsx): la
// vitrina pública es /music, y para entrar a una ficha hace falta cuenta.
//
// La API, en cambio, es pública y devuelve solo el catálogo aprobado: responde
// 404 sobre un álbum que todavía no se revisó.
//
// El layout es de dos columnas desde LG, igual que la ficha de canción y que el
// perfil: a la izquierda lo que se lee de corrido (canciones, reseñas,
// discografía) y a la derecha una columna que queda fija con lo que se consulta
// de reojo (las acciones y los datos del disco). El tracklist y las reseñas son
// listas largas, y tener el botón de calificar siempre a la vista es lo que
// evita volver a subir hasta la cabecera.
//
// Las reseñas las pone entera la feature review, con su propia sección: acá solo
// se le dice qué ítem mostrar y se le pasa el `reload` del álbum, para que su
// calificación promedio se actualice apenas alguien publique, edite o borre una.
import { useParams } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { BackLink } from '../../../core/components/BackLink';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useFetch } from '../../../core/hooks/useFetch';
import { ReviewsSection } from '../../review/components/ReviewsSection';
import { reviewService } from '../../review/services/reviewService';
import { albumService } from '../services/albumService';
import { AlbumActions } from '../components/AlbumActions';
import { AlbumHero } from '../components/AlbumHero';
import { AlbumInfoPanel } from '../components/AlbumInfoPanel';
import { AlbumMoreFromArtist } from '../components/AlbumMoreFromArtist';
import { AlbumSectionNav } from '../components/AlbumSectionNav';
import { scrollToSection } from '../../../core/utils/scrollToSection';
import { AlbumTracklist } from '../components/AlbumTracklist';
import '../styles/_album.scss';

export const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: album,
    isLoading,
    error,
    reload,
  } = useFetch(() => albumService.getById(Number(id)), id);

  // La reseña propia sobre este álbum, para poder mostrar "Tu nota" en la
  // cabecera. La sección de reseñas la pide por su cuenta para saber si el botón
  // dice "escribir" o "editar": son dos pantallas distintas del mismo dato y
  // levantarlo hasta acá obligaría a meterle props de más a esa sección, que es
  // de otra feature. Si la request falla, el error se ignora a propósito: sin
  // ese dato la ficha se sigue viendo entera, solo que sin la nota propia.
  const { data: myReview, reload: reloadMyReview } = useFetch(
    () => reviewService.getMine({ kind: 'album', id: Number(id) }),
    id
  );

  /** Después de publicar, editar o borrar una reseña hay que refrescar las dos. */
  const handleReviewChange = () => {
    void reload();
    void reloadMyReview();
  };

  // El formulario de reseña vive dentro de la sección de reseñas, así que los
  // botones de calificar llevan la vista hasta ahí en vez de abrirlo.
  const handleRate = () => scrollToSection('resenas');

  const myRating = myReview?.rating ?? null;

  return (
    <>
      <Navbar />

      <main className="album-detail">
        {isLoading ? (
          <div className="album-detail__state">
            <Loader message="Cargando el álbum..." />
          </div>
        ) : error ? (
          <div className="album-detail__state">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : album ? (
          <>
            {/* Vuelve al lugar del que se vino, sea la ficha de un género, el
                explorador o un listado por década (ver BackLink). Va arriba de
                todo, como en cualquier ficha: abajo del tracklist y de las
                reseñas quedaba a una pantalla y media de scroll. */}
            <div className="album-detail__topbar">
              <BackLink fallbackTo="/music" />
            </div>

            <AlbumHero album={album} myRating={myRating} onRate={handleRate} />

            <AlbumSectionNav showDiscography={album.artist !== null} />

            <div className="album-detail__body">
              <div className="album-detail__main">
                <section className="album-detail__section" id="canciones">
                  <header className="album-detail__section-head">
                    <h2 className="album-detail__section-title">Canciones</h2>
                    <span className="album-detail__section-count">{album.songsLabel}</span>
                  </header>

                  <AlbumTracklist songs={album.songs} artistName={album.artistName} />
                </section>

                {/* onReviewChange vuelve a pedir el álbum: average_rating es una
                    columna derivada que recalcula el CRUD de reseñas, así que sin
                    esto la cabecera seguiría mostrando el promedio viejo. */}
                <section className="album-detail__section" id="resenas">
                  <ReviewsSection
                    targetKind="album"
                    targetId={album.id}
                    onReviewChange={handleReviewChange}
                  />
                </section>

                {album.artist && (
                  <AlbumMoreFromArtist
                    artistId={album.artist.id}
                    artistName={album.artist.name}
                    currentAlbumId={album.id}
                  />
                )}
              </div>

              <aside className="album-detail__aside">
                <AlbumActions
                  album={album}
                  myRating={myRating}
                  onRate={handleRate}
                  showDiscography={album.artist !== null}
                />

                <AlbumInfoPanel album={album} />
              </aside>
            </div>
          </>
        ) : (
          <div className="album-detail__state">
            <EmptyState
              icon={<Disc3 size={22} />}
              title="No encontramos ese álbum."
              message="Puede que se haya dado de baja del catálogo o que el enlace esté mal."
            />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};
