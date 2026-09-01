// Panel de la pestaña "Membresía" del perfil propio: qué plan tiene el usuario,
// hasta cuándo, su historial de pagos y el botón para darla de baja.
//
// Solo se muestra en el perfil propio. La membresía y los pagos son datos
// privados: el backend ni siquiera los devuelve para otro usuario, porque las dos
// rutas que los traen son "mine" y sacan el usuario del token.
import { useState } from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button, ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { membershipService } from '../services/membershipService';
import '../styles/_membership.scss';

/** Formatea una fecha como "12 de agosto de 2026". */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const MembershipPanel = () => {
  const { refreshSession } = useAuth();

  const {
    data: membership,
    isLoading,
    error,
    reload,
  } = useFetch(() => membershipService.getMyMembership());

  const { data: payments, reload: reloadPayments } = useFetch(() =>
    membershipService.getMyPayments()
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const current = membership?.current ?? null;

  // Dar de baja saca el rol PRO, así que hay que pedir un token nuevo: si no, el
  // usuario seguiría entrando a las pantallas que ya no le corresponden hasta
  // que venza el token viejo.
  const handleCancel = async () => {
    setIsCancelling(true);
    setActionError(null);

    try {
      await membershipService.cancelMembership();
      await refreshSession();
      await reload();
      await reloadPayments();
      setIsDialogOpen(false);
    } catch (cancelError) {
      setActionError(getErrorMessage(cancelError));
    } finally {
      setIsCancelling(false);
    }
  };

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

      {actionError && <Alert tone="error">{actionError}</Alert>}

      {current ? (
        <div className="membership-card">
          <div className="membership-card__header">
            <span className="membership-card__label">Tu plan actual</span>
            <span className="membership-card__plan">{current.planName}</span>
          </div>

          <dl className="membership-card__facts">
            <div>
              <dt>Activa desde</dt>
              <dd>{formatDate(current.startDate)}</dd>
            </div>
            {current.endDate && (
              <div>
                <dt>Vence el</dt>
                <dd>{formatDate(current.endDate)}</dd>
              </div>
            )}
            {current.daysLeft !== null && (
              <div>
                <dt>Le quedan</dt>
                <dd>{current.daysLeft === 1 ? '1 día' : `${current.daysLeft} días`}</dd>
              </div>
            )}
          </dl>

          {/* La membresía no se renueva sola: avisar antes de que venza es lo
              que evita que el usuario pierda el acceso sin enterarse. */}
          {current.isExpiringSoon && (
            <p className="membership-card__notice" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              Tu membresía está por vencer. Renovala para no perder los beneficios Pro.
            </p>
          )}

          <div className="membership-card__actions">
            {/* Va directo al resumen y no a la página de venta: el que ya es Pro
                no necesita que le vendan el plan de nuevo. */}
            <ButtonLink to="/pro/checkout" size="sm">
              Renovar
            </ButtonLink>
            <Button variant="danger" size="sm" onClick={() => setIsDialogOpen(true)}>
              Dar de baja
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<CreditCard size={32} />}
          title="Estás en el plan Free"
          message="Pasate a Pro para sacar los anuncios, desbloquear las estadísticas y aportar al catálogo."
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

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="¿Dar de baja tu membresía Pro?"
        message="Vas a volver al plan Free en el acto: se pierden las estadísticas, la personalización y la posibilidad de aportar al catálogo. Lo que ya aportaste al catálogo queda."
        confirmLabel={isCancelling ? 'Dando de baja...' : 'Sí, dar de baja'}
        isDestructive
        onConfirm={() => void handleCancel()}
        onCancel={() => setIsDialogOpen(false)}
      />
    </section>
  );
};
