// Ficha pública de un álbum: su portada y sus datos, el tracklist con la
// calificación de cada canción, y las reseñas del álbum.
//
// Es a donde llevan las tarjetas de álbum de la ficha de un género, las del
// explorador (/music) y las del listado. La ruta pide sesión (ver App.tsx): la
// vitrina pública es /music, y para entrar a una ficha hace falta cuenta.
//
// La API, en cambio, es pública y devuelve solo el catálogo aprobado: responde
// 404 sobre un álbum que todavía no se revisó.
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
import { AlbumCover } from '../../genre/components/AlbumCover';
import { ReviewsSection } from '../../review/components/ReviewsSection';
import { albumService } from '../services/albumService';
import { AlbumRating } from '../components/AlbumRating';
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

  return (
    <>
      <Navbar />

      <main className="album-detail">
        {isLoading ? (
          <Loader message="Cargando el álbum..." />
        ) : error ? (
          <Alert tone="error">{error}</Alert>
        ) : album ? (
          <>
            <header className="album-detail__header">
              <AlbumCover title={album.title} url={album.urlCover} size="lg" />

              <div className="album-detail__info">
                <p className="album-detail__eyebrow">Álbum</p>
                <h1 className="album-detail__title">{album.title}</h1>
                <p className="album-detail__artist">{album.artistName}</p>

                <p className="album-detail__meta">
                  {album.yearLabel} · {album.genresLabel}
                </p>

                <AlbumRating
                  value={album.averageRating}
                  count={album.reviewsCount}
                  size="lg"
                />
              </div>
            </header>

            <section className="album-detail__section">
              <h2 className="album-detail__section-title">
                Canciones ({album.songs.length})
              </h2>
              <AlbumTracklist songs={album.songs} />
            </section>

            <section className="album-detail__section">
              {/* onReviewChange vuelve a pedir el álbum: average_rating es una
                  columna derivada que recalcula el CRUD de reseñas, así que sin
                  esto la cabecera seguiría mostrando el promedio viejo. */}
              <ReviewsSection targetKind="album" targetId={album.id} onReviewChange={reload} />
            </section>

            {/* Vuelve al lugar del que se vino, sea la ficha de un género, el
                explorador o un listado por década (ver BackLink). */}
            <BackLink fallbackTo="/music" />
          </>
        ) : (
          <EmptyState
            icon={<Disc3 size={22} />}
            title="No encontramos ese álbum."
            message="Puede que se haya dado de baja del catálogo o que el enlace esté mal."
          />
        )}
      </main>

      <Footer />
    </>
  );
};
