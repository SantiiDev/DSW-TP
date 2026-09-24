// Tablero de métricas del panel de administración: ventas de la membresía Pro y
// usuarios por plan.
//
// Es presentacional: no pide datos, los recibe ya armados en un RevenueStats. Así
// se prueba con un render sin red y la sección que lo monta se ocupa sola de la
// carga, los errores y el año elegido.
//
// Reutiliza los gráficos de core/components/charts, los mismos de las
// estadísticas avanzadas: no suma ninguna dependencia.
import { TrendingUp } from 'lucide-react';
import { AreaLineChart } from '../../../core/components/charts/AreaLineChart';
import { DonutChart } from '../../../core/components/charts/DonutChart';
import { StatNumber } from '../../../core/components/charts/StatNumber';
import { EmptyState } from '../../../core/components/EmptyState';
import { MONTH_SHORT_NAMES } from '../../review/models/AdvancedStats';
import { formatArs } from '../models/Membership';
import { ROLE_LABELS } from '../models/RevenueStats';
import type { RevenueStats } from '../models/RevenueStats';
import '../styles/_membership.scss';
import '../styles/_revenue-dashboard.scss';

type RevenueDashboardProps = {
  stats: RevenueStats;
};

/** "12 sep 2026": corto, porque la tabla de últimas ventas tiene poco ancho en mobile. */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Decimales de un importe: los centavos solo si los tiene, igual que formatArs. */
function moneyDecimals(amount: number): number {
  return Number.isInteger(amount) ? 0 : 2;
}

export const RevenueDashboard = ({ stats }: RevenueDashboardProps) => {
  const salesLabel = stats.salesYear === 1 ? 'venta de Pro' : 'ventas de Pro';

  return (
    <div className="revenue-dashboard">
      <section className="revenue-kpis" aria-label="Resumen de ventas">
        <div className="revenue-card revenue-card--highlight">
          {/* Sin size="xl": ese tamaño es para la portada ancha de "Tu año en
              música" y en una columna de la fila se desborda. El dato estrella se
              distingue por el borde y un tamaño apenas mayor (ver el .scss). */}
          <StatNumber
            value={stats.totalAllTime}
            decimals={moneyDecimals(stats.totalAllTime)}
            prefix="$ "
            label="cobrados desde el lanzamiento"
          />
        </div>
        <div className="revenue-card">
          <StatNumber
            value={stats.totalYear}
            decimals={moneyDecimals(stats.totalYear)}
            prefix="$ "
            label={`cobrados en ${stats.year}`}
          />
        </div>
        <div className="revenue-card">
          <StatNumber value={stats.salesYear} label={`${salesLabel} en ${stats.year}`} />
        </div>
        <div className="revenue-card">
          <StatNumber
            value={stats.averageTicket}
            decimals={moneyDecimals(stats.averageTicket)}
            prefix="$ "
            label="ticket promedio"
          />
        </div>
        <div className="revenue-card">
          <StatNumber
            value={stats.conversion}
            decimals={1}
            suffix="%"
            label="de los usuarios compró Pro"
          />
        </div>
      </section>

      <section className="revenue-card revenue-card--wide">
        <h3 className="revenue-card__title">Ingresos mes a mes</h3>
        <p className="revenue-card__subtitle">Lo cobrado en cada mes de {stats.year}.</p>

        {stats.hasSalesThisYear ? (
          <AreaLineChart
            points={stats.monthly.map((entry) => ({
              label: MONTH_SHORT_NAMES[entry.month - 1],
              value: entry.revenue,
            }))}
            formatValue={formatArs}
            ariaLabel={`Ingresos por mes en ${stats.year}`}
          />
        ) : (
          <EmptyState
            icon={<TrendingUp size={32} />}
            title={`Sin ventas en ${stats.year}`}
            message="La curva aparece con la primera membresía Pro que se cobre en el año."
          />
        )}
      </section>

      <section className="revenue-card">
        <h3 className="revenue-card__title">Usuarios por plan</h3>
        <p className="revenue-card__subtitle">Cuentas activas; las suspendidas no cuentan.</p>

        {/* La tarjeta se estira hasta el alto de "Últimas ventas", que está al
            lado: este cuerpo ocupa ese alto sobrante y centra el gráfico en él. */}
        <div className="revenue-card__body">
          {stats.totalUsers > 0 ? (
            <DonutChart
              segments={stats.usersByRole.map((row) => ({
                label: ROLE_LABELS[row.role],
                value: row.count,
              }))}
              centerValue={String(stats.totalUsers)}
              centerLabel={stats.totalUsers === 1 ? 'usuario' : 'usuarios'}
              formatValue={(segment, share) => `${segment.value} · ${Math.round(share * 100)}%`}
              ariaLabel="Usuarios activos por plan"
            />
          ) : (
            <p className="revenue-card__empty">Todavía no hay cuentas activas.</p>
          )}
        </div>

        {/* Los dos orígenes de un Pro: el que pagó y el que asignó un admin a
            mano. Por eso "Pro" en el gráfico puede no coincidir con las ventas. */}
        <p className="revenue-card__note">
          {stats.proPaid} {stats.proPaid === 1 ? 'compró' : 'compraron'} Pro ·{' '}
          {stats.proAssigned} {stats.proAssigned === 1 ? 'asignado' : 'asignados'} por un admin
        </p>
      </section>

      <section className="revenue-card">
        <h3 className="revenue-card__title">Últimas ventas</h3>

        {stats.hasAnySale ? (
          <table className="membership-payments">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Usuario</th>
                <th scope="col">Importe</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{formatShortDate(sale.date)}</td>
                  <td>{sale.username ?? '—'}</td>
                  <td>{sale.amountLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="revenue-card__empty">Todavía no se vendió ninguna membresía.</p>
        )}
      </section>
    </div>
  );
};
