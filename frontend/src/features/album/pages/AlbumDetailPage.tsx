// Ficha pública de un álbum: su portada y sus datos, el tracklist con la
// calificación de cada canción, y las reseñas del álbum.
//
// Es a donde llevan las tarjetas de álbum de la ficha de un género (/genres/:id).
// Es una página pública, igual que esa: leer el catálogo aprobado no pide token,
// y por eso la API responde 404 sobre un álbum que todavía no está aprobado.
//
// Las reseñas todavía no tienen endpoints (es la feature review), así que esa
// sección muestra su estado vacío definitivo. Cuando existan, se reemplaza el
// EmptyState por el listado paginado sin tocar el resto de la página.
import { Link, useParams } from 'react-router-dom';
import { Disc3, Star } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { EmptyState } from '../../../core/components/EmptyState';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useFetch } from '../../../core/hooks/useFetch';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { albumService } from '../services/albumService';
import { AlbumRating } from '../components/AlbumRating';
import { AlbumTracklist } from '../components/AlbumTracklist';
import '../styles/_album.scss';

export const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: album, isLoading, error } = useFetch(() => albumService.getById(Number(id)), id);

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
              <h2 className="album-detail__section-title">Reseñas</h2>

              {/* Placeholder hasta que exista el CRUD de reseñas: ahí va el
                  listado paginado de las reseñas de este álbum. */}
              <EmptyState
                icon={<Star size={22} />}
                title="Todavía no hay reseñas de este álbum."
                message="Cuando la comunidad empiece a calificarlo, las reseñas se van a listar acá de a tandas, con su puntaje y su texto."
              />
            </section>

            {/* Se vuelve al género y no al álbum anterior: la ficha se abre desde
                la página de un género, que es el listado del que vino. */}
            <Link to="/music" className="album-detail__back">
              Volver a explorar música
            </Link>
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
