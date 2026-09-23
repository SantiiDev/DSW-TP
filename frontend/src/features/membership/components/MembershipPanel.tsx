// Panel de la pestaña "Membresía" del perfil propio: qué plan tiene el usuario,
// desde cuándo y su historial de pagos.
//
// No tiene acciones: la membresía Pro es un pago único que no vence, así que no
// hay nada que renovar ni que dar de baja. La única baja posible la aplica un
// ADMIN desde el CRUD de usuarios.
//
// Solo se muestra en el perfil propio. La membresía y los pagos son datos
// privados: el backend ni siquiera los devuelve para otro usuario, porque las dos
// rutas que los traen son "mine" y sacan el usuario del token.
import { CreditCard, ShieldCheck } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { membershipService } from '../services/membershipService';
import '../styles/_membership.scss';

/** Formatea una fecha como "12 de agosto de 2026". */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const MembershipPanel = () => {
  const {
    state: { user },
  } = useAuth();

  const { data: membership, isLoading, error } = useFetch(() => membershipService.getMyMembership());

  const { data: payments } = useFetch(() => membershipService.getMyPayments());

  const current = membership?.current ?? null;

  if (isLoading) return <Loader message="Cargando tu membresía..." />;

  if (error) {
    return (
      <section className="profile-panel">
        <h2 className="profile-panel__title">Membresía</h2>
        <Alert tone="error">{error}</Alert>
      </section>
    );
  }

  return (
    <section className="profile-panel">
      <h2 className="profile-panel__title">Membresía</h2>

      {current ? (
        <div className="membership-card">
          <div className="membership-card__header">
            <span className="membership-card__label">Tu plan actual</span>
            <span className="membership-card__plan">{current.planName}</span>
          </div>

          <dl className="membership-card__facts">
            {/* Sin fecha real en la genérica de un PRO asignado a mano por un
                admin (ver subscriptionService.getMine en el backend). */}
            {current.startDate && (
              <div>
                <dt>Activa desde</dt>
                <dd>{formatDate(current.startDate)}</dd>
              </div>
            )}
            <div>
              <dt>Vigencia</dt>
              <dd>Para siempre</dd>
            </div>
          </dl>

          {/* Es lo que reemplaza al aviso de vencimiento y al botón de renovar
              que tenía el panel cuando la membresía era mensual: con el pago
              único no hay nada que vencer ni que volver a pagar. */}
          <p className="membership-card__notice" role="status">
            <ShieldCheck size={16} aria-hidden="true" />
            Pagaste una sola vez: tu acceso Pro no vence ni se renueva.
          </p>
        </div>
      ) : user?.isAdmin ? (
        // Un ADMIN no necesita ningún plan: tiene acceso completo por su rol, no
        // por una suscripción (ver el comentario de subscription.service.ts). Si
        // en algún momento pagó Pro igual, `current` no sería null y entraría por
        // la rama de arriba con su suscripción real.
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title="Tenés acceso completo como administrador"
          message="No necesitás ningún plan: tu rol ya te da todos los beneficios, sin las restricciones de Free ni Pro."
        />
      ) : (
        <EmptyState
          icon={<CreditCard size={32} />}
          title="Estás en el plan Free"
          message="Pasate a Pro con un solo pago y desbloqueá las estadísticas, las listas y el aporte al catálogo."
          action={<ButtonLink to="/pro">Ver planes</ButtonLink>}
        />
      )}

      <h3 className="profile-panel__subtitle">Historial de pagos</h3>

      {payments && payments.length > 0 ? (
        <table className="membership-payments">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Plan</th>
              <th scope="col">Importe</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDate(payment.date)}</td>
                <td>{payment.planName ?? '—'}</td>
                <td>{payment.amountLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="membership-payments__empty">Todavía no hiciste ningún pago.</p>
      )}
    </section>
  );
};
