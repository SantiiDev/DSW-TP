// Portada de las estadísticas avanzadas: "Tu año en música", con el dato estrella
// (cuánta música calificó), los totales y las frases destacadas del año.
//
// La usan la pestaña "Estadísticas" del perfil y, en su versión compacta (sin las
// frases), el área de socio de /pro.
import { CalendarDays, PenLine, Star, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatNumber } from '../../../core/components/charts/StatNumber';
import type { AdvancedStats } from '../models/AdvancedStats';

/** Una frase destacada del año: "Tu género favorito: Rock". */
type Highlight = {
  icon: LucideIcon;
  text: string;
  value: string;
};

type StatsHeroProps = {
  stats: AdvancedStats;
  /** Sin las frases destacadas, para un resumen dentro de otra página. */
  compact?: boolean;
};

/** Formatea una nota con coma decimal, como el resto del sitio ("3,5"). */
function formatRating(rating: number): string {
  return rating.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export const StatsHero = ({ stats, compact = false }: StatsHeroProps) => {
  const { summary } = stats;
  // Con menos de una hora, "0,4 horas" no dice nada: se muestran los minutos.
  const showHours = stats.hours >= 1;

  // Cada frase solo aparece si hay dato para armarla: un año con reseñas de
  // canciones sin género cargado no tiene "género favorito".
  const highlights: Highlight[] = [];
  if (stats.mostActiveMonthName) {
    highlights.push({ icon: CalendarDays, text: 'Tu mes más activo fue', value: stats.mostActiveMonthName });
  }
  if (stats.favoriteGenre) {
    highlights.push({ icon: Tag, text: 'Tu género favorito', value: stats.favoriteGenre });
  }
  if (stats.mostCommonRating !== null) {
    highlights.push({
      icon: Star,
      text: 'La nota que más pusiste',
      value: `${formatRating(stats.mostCommonRating)} ★`,
    });
  }
  if (summary.reviews > 0) {
    highlights.push({
      icon: PenLine,
      text: 'Reseñas con texto',
      value: `${summary.writtenReviews} de ${summary.reviews}`,
    });
  }

  return (
    <section className={`stats-hero ${compact ? 'stats-hero--compact' : ''}`}>
      <div className="stats-hero__intro">
        <p className="stats-hero__eyebrow">Tu {stats.year} en música</p>
        <StatNumber
          size="xl"
          value={showHours ? stats.hours : summary.minutes}
          decimals={showHours ? 1 : 0}
          label={showHours ? 'horas de música calificada' : 'minutos de música calificada'}
        />
      </div>

      <div className="stats-hero__totals">
        <StatNumber value={summary.reviews} label="Reseñas" />
        <StatNumber value={summary.albums} label="Álbumes" />
        <StatNumber value={summary.songs} label="Canciones" />
        <StatNumber value={summary.artists} label="Artistas" />
      </div>

      {!compact && highlights.length > 0 && (
        <ul className="stats-hero__highlights">
          {highlights.map(({ icon: Icon, text, value }) => (
            <li key={text} className="stats-hero__highlight">
              <span className="stats-hero__highlight-icon" aria-hidden="true">
                <Icon size={16} />
              </span>
              <span className="stats-hero__highlight-text">{text}</span>
              <strong className="stats-hero__highlight-value">{value}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
