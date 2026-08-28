// Sección "Tendencia Ahora" del explorador: lo último que se sumó al catálogo.
//
// El criterio definitivo sería la actividad de reseñas de los últimos días, pero
// eso necesita la feature review, que todavía no existe. Mientras tanto muestra
// los últimos agregados, que SÍ es un dato real y distinto del de las otras
// secciones. Cuando exista Review, lo único que hay que cambiar es el `sort`.
import { TrendingUp } from 'lucide-react';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import { songService } from '../../song/services/songService';
import { albumToExploreItem, songToExploreItem } from '../models/ExploreItem';
import { ExploreMusicCard } from './ExploreMusicCard';
import { ExploreSectionShell } from './ExploreSectionShell';

type TrendingSectionProps = {
  type: 'albums' | 'canciones';
};

/** Cuántas tarjetas trae la sección: dos filas de tres en escritorio. */
const SECTION_SIZE = 6;

export const TrendingSection = ({ type }: TrendingSectionProps) => {
  // La clave es `type`: al cambiar de pestaña se vuelve a pedir, porque son dos
  // endpoints distintos.
  const { data, isLoading, error } = useFetch(async () => {
    if (type === 'albums') {
      const albums = await albumService.explore({ sort: 'recent', limit: SECTION_SIZE });
      return albums.map(albumToExploreItem);
    }

    const songs = await songService.explore({ sort: 'recent', limit: SECTION_SIZE });
    return songs.map(songToExploreItem);
  }, type);

  const items = data ?? [];
  const seeAllTo = type === 'albums' ? '/albums?sort=recent' : '/songs?sort=recent';

  return (
    <ExploreSectionShell
      icon={<TrendingUp size={22} />}
      title="Tendencia Ahora"
      seeAllTo={seeAllTo}
      isLoading={isLoading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="Todavía no hay nada cargado en el catálogo."
    >
      <div className="explore-section__grid">
        {items.map((item) => (
          <ExploreMusicCard key={item.id} item={item} />
        ))}
      </div>
    </ExploreSectionShell>
  );
};
