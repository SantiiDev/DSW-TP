// Sección "Mejores Calificados" del explorador: el ranking por calificación
// promedio de la comunidad.
//
// Es la única de las tres secciones que dependen de reseñas cuyo criterio ya es
// el definitivo: ordena por `average_rating`, la columna derivada que va a
// mantener el CRUD de reseñas. Hoy el catálogo entero está en 0 y el desempate lo
// resuelve el orden alfabético, así que el ranking recién va a significar algo
// cuando exista Review; no hay que tocar nada acá para eso.
import { Award } from 'lucide-react';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import { songService } from '../../song/services/songService';
import { albumToExploreItem, songToExploreItem } from '../models/ExploreItem';
import { ExploreMusicRow } from './ExploreMusicRow';
import { ExploreSectionShell } from './ExploreSectionShell';

type TopRatedSectionProps = {
  type: 'albums' | 'canciones';
};

/** Cuántos puestos muestra el ranking. */
const SECTION_SIZE = 5;

export const TopRatedSection = ({ type }: TopRatedSectionProps) => {
  const { data, isLoading, error } = useFetch(async () => {
    if (type === 'albums') {
      const albums = await albumService.explore({ sort: 'rating', limit: SECTION_SIZE });
      return albums.map(albumToExploreItem);
    }

    const songs = await songService.explore({ sort: 'rating', limit: SECTION_SIZE });
    return songs.map(songToExploreItem);
  }, type);

  const items = data ?? [];
  const seeAllTo = type === 'albums' ? '/albums?sort=rating' : '/songs?sort=rating';

  return (
    <ExploreSectionShell
      icon={<Award size={22} />}
      title="Mejores Calificados"
      iconTone="gold"
      seeAllTo={seeAllTo}
      isLoading={isLoading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="Todavía no hay nada cargado en el catálogo."
    >
      <div className="explore-section__list">
        {items.map((item, index) => (
          <ExploreMusicRow key={item.id} item={item} rank={index + 1} />
        ))}
      </div>
    </ExploreSectionShell>
  );
};
