// Pestaña "Estadísticas" para un usuario Free: el tablero difuminado detrás de un
// cartel que invita a pasarse a Pro.
//
// NO pide nada a la API. Los números de atrás son de muestra, fijos y claramente
// decorativos: sirven para que se vea qué se desbloquea, no son del usuario. La
// restricción que importa es la del backend, que a un FREE le responde 403.
import { Lock, Sparkles } from 'lucide-react';
import { ButtonLink } from '../../../core/components/Button';
import { AdvancedStats } from '../models/AdvancedStats';
import { StatsDashboard } from './StatsDashboard';

/** Tablero de muestra. Artistas y álbumes inventados a propósito: no linkean a nada. */
const SAMPLE_STATS = new AdvancedStats(
  new Date().getFullYear(),
  [new Date().getFullYear()],
  {
    reviews: 48,
    albums: 31,
    songs: 17,
    artists: 22,
    genres: 7,
    averageRating: 3.8,
    writtenReviews: 29,
    minutes: 2140,
  },
  [4, 2, 6, 3, 5, 8, 7, 3, 2, 4, 1, 3].map((reviews, index) => ({
    month: index + 1,
    reviews,
    averageRating: 3.8,
  })),
  [
    { id: 1, name: 'Rock', count: 18, percentage: 36 },
    { id: 2, name: 'Rock Nacional', count: 11, percentage: 22 },
    { id: 3, name: 'Alternativo', count: 8, percentage: 16 },
    { id: 4, name: 'Pop', count: 6, percentage: 12 },
    { id: null, name: 'Otros', count: 7, percentage: 14 },
  ],
  [
    { id: 1, name: 'Artista de muestra', count: 6, averageRating: 4.5, coverUrl: null },
    { id: 2, name: 'Banda de ejemplo', count: 4, averageRating: 4, coverUrl: null },
    { id: 3, name: 'Otro artista', count: 3, averageRating: 3.5, coverUrl: null },
  ],
  [
    { id: 1, title: 'Disco uno', artist: 'Artista de muestra', coverUrl: null, rating: 5 },
    { id: 2, title: 'Disco dos', artist: 'Banda de ejemplo', coverUrl: null, rating: 4.5 },
    { id: 3, title: 'Disco tres', artist: 'Otro artista', coverUrl: null, rating: 4.5 },
    { id: 4, title: 'Disco cuatro', artist: 'Artista de muestra', coverUrl: null, rating: 4 },
    { id: 5, title: 'Disco cinco', artist: 'Banda de ejemplo', coverUrl: null, rating: 4 },
  ],
  [
    { decade: 1970, count: 9 },
    { decade: 1980, count: 14 },
    { decade: 1990, count: 12 },
    { decade: 2010, count: 8 },
  ],
  [0, 1, 1, 2, 3, 6, 9, 12, 8, 6],
  6,
  'Rock',
  4
);

export const LockedStatsPreview = () => {
  return (
    <section className="profile-panel stats-panel stats-locked">
      <h2 className="profile-panel__title stats-panel__title">Estadísticas</h2>

      <div className="stats-locked__stage">
        {/* inert saca el tablero del foco y de los clics; aria-hidden, del lector
            de pantalla, que no tiene por qué leer números de muestra. */}
        <div className="stats-locked__preview" aria-hidden="true" inert>
          <StatsDashboard stats={SAMPLE_STATS} isInteractive={false} />
        </div>

        <div className="stats-locked__overlay">
          <div className="stats-locked__card">
            <span className="stats-locked__icon" aria-hidden="true">
              <Lock size={22} />
            </span>
            <span className="stats-locked__badge">PRO</span>
            <h3 className="stats-locked__title">Desbloqueá tu año en música</h3>
            <p className="stats-locked__text">
              Tus géneros más escuchados, tus artistas y álbumes favoritos, tu actividad mes a mes
              y cuánta música calificaste. Todo armado con tus reseñas.
            </p>
            <ButtonLink to="/pro">
              <Sparkles size={16} aria-hidden="true" />
              Pasarme a Pro
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
};
