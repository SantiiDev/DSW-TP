// Sección "Explorar por Década" del explorador: cuántos álbumes del catálogo hay
// en cada década, y el acceso al listado de cada una.
//
// Los conteos salen de `GET /api/albums/decades`, que los arma a partir de los
// años de lanzamiento. Las décadas sin ningún álbum no se dibujan: llevarían a un
// listado vacío.
//
// Es solo de álbumes y no cambia con la pestaña, por el mismo motivo que "Nuevos
// Lanzamientos": la canción no tiene año propio.
import { Calendar } from 'lucide-react';
import { GatedLink } from '../../../core/components/GatedLink';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import { ExploreSectionShell } from './ExploreSectionShell';

// Un emoji por década, en el mismo orden en que las devuelve la API (de la más
// nueva a la más vieja). Es decoración, no un dato del negocio, así que vive acá
// y no en el backend.
const DECADE_EMOJIS = ['🔥', '💫', '💿', '📀', '🎸', '🎵', '✌️', '🎺'];

export const BrowseByDecadeSection = () => {
  const { data, isLoading, error } = useFetch(() => albumService.decades());

  // Las vacías no se muestran: la tarjeta llevaría a un listado sin resultados.
  const decades = (data ?? []).filter((decade) => decade.hasAlbums);

  return (
    <ExploreSectionShell
      icon={<Calendar size={22} />}
      title="Explorar por Década"
      isLoading={isLoading}
      error={error}
      isEmpty={decades.length === 0}
      emptyMessage="Todavía no hay álbumes con año de lanzamiento cargado."
    >
      <div className="decade-grid">
        {decades.map((decade, index) => (
          <GatedLink
            key={decade.label}
            // El listado recibe el rango tal cual: son los mismos parámetros que
            // entiende la API.
            to={`/albums?year_from=${decade.from}&year_to=${decade.to}&sort=year`}
            className="decade-card"
          >
            <span className="decade-card__emoji" aria-hidden="true">
              {DECADE_EMOJIS[index % DECADE_EMOJIS.length]}
            </span>
            <div className="decade-card__info">
              <span className="decade-card__decade">{decade.label}</span>
              <span className="decade-card__years">{decade.yearsLabel}</span>
            </div>
            <span className="decade-card__count">{decade.countLabel}</span>
          </GatedLink>
        ))}
      </div>
    </ExploreSectionShell>
  );
};
