// Test unitario del panel de membresía del perfil propio.
//
// Verifica la regla del pago único: el panel muestra la membresía pero NO ofrece
// renovarla ni darla de baja, porque se paga una sola vez y el acceso no vence.
// Es la parte del cambio que no se puede ver leyendo el backend, así que se fija
// acá, en lo que realmente se dibuja.
//
// A diferencia de SegmentedControl, este componente sí depende de su entorno:
// pide datos por su servicio, lee el usuario del AuthContext y usa <Link>. Los
// dos primeros se reemplazan por mocks y el tercero se resuelve envolviendo el
// render en un MemoryRouter; así el test prueba el componente y no la API.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Payment, Subscription } from '../models/Membership';
import { MembershipPanel } from './MembershipPanel';

// El servicio es la frontera con la API: mockeándolo, el componente se monta sin
// que exista un backend levantado ni una sesión abierta.
vi.mock('../services/membershipService', () => ({
  membershipService: {
    getMyMembership: vi.fn(),
    getMyPayments: vi.fn(),
  },
}));

// El panel solo lee `state.user` para distinguir al ADMIN, que ve otro mensaje.
vi.mock('../../../core/context/AuthContext', () => ({
  useAuth: () => ({ state: { user: { isAdmin: false } } }),
}));

import { membershipService } from '../services/membershipService';

/** Una membresía Pro comprada: con fecha de alta y SIN vencimiento. */
const proSubscription = new Subscription(1, 2, 'Pro', 3500, new Date(2026, 8, 1), null, 'active');

const renderPanel = () =>
  render(
    <MemoryRouter>
      <MembershipPanel />
    </MemoryRouter>
  );

describe('MembershipPanel', () => {
  beforeEach(() => {
    vi.mocked(membershipService.getMyMembership).mockResolvedValue({
      current: proSubscription,
      history: [proSubscription],
    });
    vi.mocked(membershipService.getMyPayments).mockResolvedValue([
      new Payment(1, 3500, new Date(2026, 8, 1), 'approved', 'Pro'),
    ]);
  });

  it('muestra el plan vigente y su vigencia como permanente', async () => {
    renderPanel();

    expect(await screen.findByText('Tu plan actual')).toBeInTheDocument();
    // "Pro" aparece dos veces: como plan vigente y en la fila del historial de
    // pagos. Se pide el conjunto en vez de uno solo para no depender del orden.
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('Vigencia')).toBeInTheDocument();
    expect(screen.getByText('Para siempre')).toBeInTheDocument();
  });

  it('avisa que el pago fue único y que el acceso no vence', async () => {
    renderPanel();

    expect(
      await screen.findByText(/Pagaste una sola vez: tu acceso Pro no vence ni se renueva/)
    ).toBeInTheDocument();
  });

  // El corazón del cambio: con el pago único estas dos acciones no existen más.
  it('no ofrece renovar ni dar de baja la membresía', async () => {
    renderPanel();

    // Se espera a que termine la carga antes de afirmar que algo NO está: sobre
    // el loader inicial cualquier queryBy daría null y el test pasaría de mentira.
    await screen.findByText('Para siempre');

    expect(screen.queryByText('Renovar')).not.toBeInTheDocument();
    expect(screen.queryByText('Dar de baja')).not.toBeInTheDocument();
  });

  // Los datos del modelo mensual: si alguno vuelve, el panel volvió atrás.
  it('no muestra fecha de vencimiento ni días restantes', async () => {
    renderPanel();
    await screen.findByText('Para siempre');

    expect(screen.queryByText('Vence el')).not.toBeInTheDocument();
    expect(screen.queryByText('Le quedan')).not.toBeInTheDocument();
  });

  it('invita a pasarse a Pro con un solo pago cuando no hay membresía', async () => {
    vi.mocked(membershipService.getMyMembership).mockResolvedValue({
      current: null,
      history: [],
    });

    renderPanel();

    expect(await screen.findByText('Estás en el plan Free')).toBeInTheDocument();
    expect(screen.getByText(/Pasate a Pro con un solo pago/)).toBeInTheDocument();
  });
});
