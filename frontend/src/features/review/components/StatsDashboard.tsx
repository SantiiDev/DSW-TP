// Tablero completo de las estadísticas avanzadas: acomoda cada sección en la
// grilla. No pide datos: los recibe ya armados, así lo pueden usar tanto la
// pestaña con los datos reales como la vista previa bloqueada con datos de muestra.
import { AreaLineChart } from '../../../core/components/charts/AreaLineChart';
import { DonutChart } from '../../../core/components/charts/DonutChart';
import { HorizontalBarList } from '../../../core/components/charts/HorizontalBarList';
import { CHART_OTHERS_COLOR } from '../../../core/components/charts/chartPalette';
import { RatingHistogram } from '../../user/components/RatingHistogram';
import { MONTH_SHORT_NAMES } from '../models/AdvancedStats';
import type { AdvancedStats } from '../models/AdvancedStats';
import { StatsHero } from './StatsHero';
import { StatsTopAlbums } from './StatsTopAlbums';
import { StatsTopArtists } from './StatsTopArtists';
import '../styles/_advanced-stats.scss';

type StatsDashboardProps = {
  stats: AdvancedStats;
  /** false en la vista previa: los ítems de muestra no llevan a ninguna ficha. */
  isInteractive?: boolean;
};

/** "Años 80" para el siglo pasado; "2010s" desde el 2000, que se lee más natural. */
function decadeLabel(decade: number): string {
  return decade < 2000 ? `Años ${String(decade).slice(2)}` : `${decade}s`;
}

export const StatsDashboard = ({ stats, isInteractive = true }: StatsDashboardProps) => {
  const reviewsLabel = (count: number) => `${count} ${count === 1 ? 'reseña' : 'reseñas'}`;

  return (
    <div className="stats-dashboard-container">
      <div className="stats-dashboard">
        <StatsHero stats={stats} />

        <section className="stats-card stats-card--wide">
          <h3 className="stats-card__title">Tu actividad mes a mes</h3>
          <p className="stats-card__subtitle">Cuántos álbumes y canciones calificaste cada mes.</p>
          <AreaLineChart
            points={stats.monthly.map((entry) => ({
              label: MONTH_SHORT_NAMES[entry.month - 1],
              value: entry.reviews,
            }))}
            formatValue={reviewsLabel}
            ariaLabel={`Reseñas por mes en ${stats.year}`}
          />
        </section>

        <section className="stats-card">
          <h3 className="stats-card__title">Géneros más escuchados</h3>
          {stats.topGenres.length === 0 ? (
            <p className="stats-card__empty">Lo que calificaste no tiene géneros cargados.</p>
          ) : (
            <DonutChart
              segments={stats.topGenres.map((genre) => ({
                label: genre.name,
                value: genre.count,
                // "Otros" va en gris para no competir con los géneros con nombre.
                color: genre.id === null ? CHART_OTHERS_COLOR : undefined,
              }))}
              centerValue={String(stats.summary.genres)}
              centerLabel={stats.summary.genres === 1 ? 'género' : 'géneros'}
              formatValue={(_segment, share) => `${Math.round(share * 100)}%`}
              ariaLabel={`Reparto de géneros en ${stats.year}`}
            />
          )}
        </section>

        <StatsTopArtists artists={stats.topArtists} />

        <StatsTopAlbums albums={stats.topAlbums} isInteractive={isInteractive} />

        <section className="stats-card">
          <h3 className="stats-card__title">Tus décadas</h3>
          <p className="stats-card__subtitle">De qué época es la música que calificaste.</p>
          {stats.decades.length === 0 ? (
            <p className="stats-card__empty">No hay años de lanzamiento cargados.</p>
          ) : (
            <HorizontalBarList
              items={stats.decades.map((entry) => ({
                id: String(entry.decade),
                label: decadeLabel(entry.decade),
                value: entry.count,
                valueLabel: String(entry.count),
              }))}
              ariaLabel="Reseñas por década de lanzamiento"
            />
          )}
        </section>

        <section className="stats-card">
          <h3 className="stats-card__title">Cómo calificás</h3>
          <p className="stats-card__subtitle">
            Tu promedio del año es{' '}
            <strong>
              ★ {stats.summary.averageRating.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </strong>
            .
          </p>
          {/* El mismo histograma de la columna lateral del perfil, pero solo con
              las notas de este año. */}
          <RatingHistogram distribution={stats.distribution} />
        </section>
      </div>
    </div>
  );
};
