// Resumen de las estadísticas del año para el área de socio de /pro: la portada
// compacta ("Tu año en música" y los totales) y el acceso al tablero completo,
// que vive en la pestaña "Estadísticas" del perfil.
//
// Solo se monta para usuarios Pro (ProMemberView ya es la cara de socio), así que
// puede pedir las estadísticas sin chequear el rol. Si igual fallan, no rompe la
// página: muestra la invitación a ir al perfil.
import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import type { AdvancedStats } from '../models/AdvancedStats';
import { reviewService } from '../services/reviewService';
import { StatsHero } from './StatsHero';
import '../styles/_advanced-stats.scss';

/** Ruta del tablero completo: el perfil propio, ya abierto en la pestaña. */
const FULL_STATS_PATH = '/profile?tab=stats';

export const StatsProSummary = () => {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    reviewService
      .advancedStats()
      .then((data) => {
        if (isCurrent) setStats(data);
      })
      // Un resumen que no cargó no es motivo para mostrar un error en la página
      // de socio: se cae al vacío con el acceso al perfil.
      .catch(() => undefined)
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) return <Loader message="Cargando tus estadísticas..." />;

  if (!stats || !stats.hasData) {
    return (
      <EmptyState
        icon={<BarChart3 size={22} />}
        title="Todavía no hay nada para graficar este año."
        message="Tus géneros más escuchados, tu evolución mensual y tu top de artistas se arman con tus reseñas. Calificá un álbum y esta sección se llena sola."
        action={
          <ButtonLink to="/music" size="sm">
            Buscar un álbum para reseñar
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="stats-summary">
      <StatsHero stats={stats} compact />
      <ButtonLink to={FULL_STATS_PATH} variant="outline" size="sm">
        Ver todas mis estadísticas
      </ButtonLink>
    </div>
  );
};
