// Sección "Más Reseñados" del explorador: lo más reseñado por la comunidad,
// histórico (sort='reviews', todas las reseñas, sin ventana de tiempo).
//
// El diseño original mostraba "oyentes", un dato que no existe en el modelo:
// Musicboxd registra reseñas, no reproducciones. Se reemplaza por la cantidad de
// reseñas, que es lo que la sección puede medir de verdad. También se iba a
// llamar "Populares Esta Semana", acotada a los últimos días, pero eso quedaría
// casi idéntico a "Tendencia Ahora" (sort='trending', ver TrendingSection.tsx),
// que ya cubre la actividad reciente: por eso esta se queda como el ranking
// histórico y no se le suma una ventana de fecha.
import { Flame } from 'lucide-react';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import { songService } from '../../song/services/songService';
import { albumToExploreItem, songToExploreItem } from '../models/ExploreItem';
import { ExploreMusicCard } from './ExploreMusicCard';
import { ExploreSectionShell } from './ExploreSectionShell';

type PopularThisWeekSectionProps = {
  type: 'albums' | 'canciones';
};

/** Cuántas tarjetas trae la sección. */
const SECTION_SIZE = 6;

export const PopularThisWeekSection = ({ type }: PopularThisWeekSectionProps) => {
  const { data, isLoading, error } = useFetch(async () => {
    if (type === 'albums') {
      const albums = await albumService.explore({ sort: 'reviews', limit: SECTION_SIZE });
      return albums.map(albumToExploreItem);
    }

    const songs = await songService.explore({ sort: 'reviews', limit: SECTION_SIZE });
    return songs.map(songToExploreItem);
  }, type);

  const items = data ?? [];
  const seeAllTo = type === 'albums' ? '/albums?sort=reviews' : '/songs?sort=reviews';

  return (
    <ExploreSectionShell
      icon={<Flame size={22} />}
      title="Más Reseñados"
      iconTone="fire"
      seeAllTo={seeAllTo}
      isLoading={isLoading}
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="Todavía no hay nada cargado en el catálogo."
    >
      {/* Misma grilla que el resto de las secciones con portada: así entran las
          seis tarjetas en una fila en vez de quedar tres grandes y un hueco. */}
      <div className="explore-section__grid">
        {items.map((item) => (
          <ExploreMusicCard key={item.id} item={item} />
        ))}
      </div>
    </ExploreSectionShell>
  );
};
