// Pestaña "Estadísticas" del perfil propio para un usuario Pro: pide sus
// estadísticas avanzadas del año elegido y las dibuja.
//
// Además de cargando, error y vacío, maneja un cuarto estado: el 403. Pasa si un
// ADMIN le bajó el rol mientras la sesión seguía abierta (el token todavía dice
// PRO, pero la API ya relee el rol de la base). En ese caso se renueva la sesión para
// que el resto de la app se entere de que volvió a ser Free, y se muestra la
// vista bloqueada.
import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import { useAuth } from '../../../core/context/AuthContext';
import { ApiError, getErrorMessage } from '../../../core/utils/errorHandler';
import type { AdvancedStats } from '../models/AdvancedStats';
import { reviewService } from '../services/reviewService';
import { LockedStatsPreview } from './LockedStatsPreview';
import { StatsDashboard } from './StatsDashboard';

export const AdvancedStatsPanel = () => {
  const { refreshSession } = useAuth();

  // undefined = el año en curso, que es lo que la API devuelve sin parámetro.
  const [year, setYear] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Si el usuario cambia de año dos veces seguidas, la respuesta vieja puede
    // llegar después que la nueva: con esta bandera se descarta.
    let isCurrent = true;

    reviewService
      .advancedStats(year)
      .then((data) => {
        if (!isCurrent) return;
        setStats(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        if (err instanceof ApiError && err.status === 403) {
          setIsLocked(true);
          void refreshSession();
          return;
        }
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
    // refreshSession se vuelve a crear en cada render del AuthProvider (solo usa
    // dispatch, que es estable): ponerlo en las dependencias pediría las
    // estadísticas otra vez cada vez que cambia la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const handleYearChange = (value: string) => {
    setIsLoading(true);
    setYear(Number(value));
  };

  if (isLocked) return <LockedStatsPreview />;

  if (isLoading && !stats) return <Loader message="Armando tus estadísticas..." />;

  if (error) return <Alert tone="error">{error}</Alert>;

  if (!stats) return null;

  return (
    <section className="profile-panel stats-panel">
      <div className="stats-panel__header">
        <div>
          <h2 className="profile-panel__title stats-panel__title">Estadísticas</h2>
          <p className="stats-panel__subtitle">Todo sale de las reseñas que publicaste.</p>
        </div>

        {stats.availableYears.length > 1 && (
          <SegmentedControl
            options={stats.availableYears.map((option) => ({
              value: String(option),
              label: String(option),
            }))}
            value={String(stats.year)}
            onChange={handleYearChange}
            ariaLabel="Año de las estadísticas"
          />
        )}
      </div>

      {stats.hasData ? (
        // La key hace que al cambiar de año el tablero se monte de nuevo, y así
        // los gráficos se vuelven a dibujar desde cero en vez de saltar.
        <div className={isLoading ? 'stats-panel__content--refreshing' : undefined}>
          <StatsDashboard key={stats.year} stats={stats} />
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title={`No publicaste reseñas en ${stats.year}.`}
          message="Tus géneros, tus artistas y tu actividad mes a mes se arman con tus reseñas. Calificá un álbum y esta sección se llena sola."
          action={
            <ButtonLink to="/music" size="sm">
              Explorar música
            </ButtonLink>
          }
        />
      )}
    </section>
  );
};
