// Test unitario del tablero de métricas del panel de administración.
//
// El componente es presentacional: recibe un RevenueStats ya armado, así que se
// monta sin mocks de red ni de sesión. Se prueban los dos estados que importan en
// la defensa: con ventas (los números salen de los datos) y sin ninguna venta
// (la zona de ingresos avisa, pero el reparto de usuarios se sigue viendo).
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentSale, RevenueStats } from '../models/RevenueStats';
import { RevenueDashboard } from './RevenueDashboard';

// Los gráficos arrancan su animación con un IntersectionObserver (useInView), que
// jsdom no implementa. Uno que nunca avisa alcanza: los números quedan sin animar,
// pero el valor final está igual en el texto para lectores de pantalla.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
});

/** Doce meses con una venta en marzo y dos en septiembre. */
const monthly = Array.from({ length: 12 }, (_, index) => ({
  month: index + 1,
  revenue: index === 2 ? 3500 : index === 8 ? 7000 : 0,
  sales: index === 2 ? 1 : index === 8 ? 2 : 0,
}));

const usersByRole = [
  { role: 'FREE' as const, count: 5 },
  { role: 'PRO' as const, count: 4 },
  { role: 'ADMIN' as const, count: 1 },
];

/** Arma un RevenueStats cambiando solo lo que cada test necesita. */
function buildStats(overrides: { sales?: boolean } = {}): RevenueStats {
  const withSales = overrides.sales ?? true;

  return new RevenueStats(
    2026,
    [2026],
    withSales ? 10500 : 0,
    withSales ? 10500 : 0,
    withSales ? 3 : 0,
    withSales ? 3500 : 0,
    withSales ? monthly : monthly.map((entry) => ({ ...entry, revenue: 0, sales: 0 })),
    10,
    usersByRole,
    withSales ? 3 : 0,
    withSales ? 1 : 4,
    withSales ? 33.3 : 0,
    withSales
      ? [new RecentSale(3, 3500, new Date(2026, 8, 20), 'lucia', 'Pro')]
      : []
  );
}

describe('RevenueDashboard', () => {
  it('muestra los totales de ventas del año', () => {
    render(<RevenueDashboard stats={buildStats()} />);

    // El total histórico y el del año son iguales en este caso: aparece dos veces.
    expect(screen.getAllByText('$ 10.500')).toHaveLength(2);
    expect(screen.getByText('cobrados en 2026')).toBeInTheDocument();
    expect(screen.getByText('ventas de Pro en 2026')).toBeInTheDocument();
    expect(screen.getByText('33,3%')).toBeInTheDocument();
  });

  it('lista las últimas ventas con su usuario e importe', () => {
    render(<RevenueDashboard stats={buildStats()} />);

    expect(screen.getByRole('columnheader', { name: 'Usuario' })).toBeInTheDocument();
    expect(screen.getByText('lucia')).toBeInTheDocument();
    // formatArs usa toLocaleString con moneda, que separa el "$" con un espacio
    // duro (U+00A0) y no con uno común: \s matchea los dos.
    expect(screen.getByRole('cell', { name: /^\$\s3\.500$/ })).toBeInTheDocument();
  });

  it('aclara cuántos Pro pagaron y cuántos asignó un admin', () => {
    render(<RevenueDashboard stats={buildStats()} />);

    expect(screen.getByText(/3 compraron Pro/)).toBeInTheDocument();
    expect(screen.getByText(/1 asignado por un admin/)).toBeInTheDocument();
  });

  it('sin ventas avisa en la zona de ingresos pero sigue mostrando los usuarios', () => {
    render(<RevenueDashboard stats={buildStats({ sales: false })} />);

    expect(screen.getByText('Sin ventas en 2026')).toBeInTheDocument();
    expect(screen.getByText('Todavía no se vendió ninguna membresía.')).toBeInTheDocument();
    // El reparto de usuarios no depende de las ventas: el donut sigue con su total.
    expect(screen.getByText('Usuarios por plan')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
