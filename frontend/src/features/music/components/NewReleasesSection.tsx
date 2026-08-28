// Sección "Nuevos Lanzamientos" del explorador: los álbumes más nuevos del
// catálogo, del año más reciente para atrás.
//
// Es solo de álbumes y no cambia con la pestaña: una canción no tiene fecha de
// lanzamiento propia (la hereda de su álbum), así que un ranking de canciones por
// año dejaría cada tracklist entero pegado en bloque.
//
// El diseño mostraba una fecha exacta ("25 Ene 2025"); el DER solo guarda el AÑO
// de lanzamiento, así que la tarjeta muestra el año.
import { Disc3 } from 'lucide-react';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import { albumToExploreItem } from '../models/ExploreItem';
import { ExploreMusicCard } from './ExploreMusicCard';
import { ExploreSectionShell } from './ExploreSectionShell';

/** Cuántas tarjetas trae la sección. */
const SECTION_SIZE = 6;

export const NewReleasesSection = () => {
  const { data, isLoading, error } = useFetch(async () => {
    const albums = await albumService.explore({ sort: 'year', limit: SECTION_SIZE });
    return albums.map(albumToExploreItem);
  });

  const items = data ?? [];

  return (
    <ExploreSectionShell
      icon={<Disc3 size={22} />}
      title="Nuevos Lanzamientos"
      spinIcon
      seeAllTo="/albums?sort=year"
      isLoading={isLoading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="Todavía no hay álbumes con año de lanzamiento cargado."
    >
      <div className="explore-section__grid explore-section__grid--compact">
        {items.map((item) => (
          <ExploreMusicCard key={item.id} item={item} variant="new" footer="year" />
        ))}
      </div>
    </ExploreSectionShell>
  );
};
