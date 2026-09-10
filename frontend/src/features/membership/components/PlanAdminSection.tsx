// Sección "Planes" del panel de administración: el ABM completo de los planes de
// membresía del sistema (alta, edición y baja).
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en PlanForm y
// PlanAdminTable. Vive en la feature membership y no en la feature user para que
// el panel (AdminPage) solo tenga que montarla, igual que GenreAdminSection.
//
// Es el mismo caso que el ABM de géneros y por eso sigue su misma forma: un plan
// no lo aporta ningún usuario, es la definición comercial del sistema, así que no
// tiene circuito de moderación, ni filtro por estado, ni buscador. Toda la
// escritura la restringe el backend a ADMIN.
//
// La diferencia con los géneros está en la baja: un género se bloquea por los
// álbumes que tiene asignados; un plan, por las suscripciones que lo apuntan,
// incluidas las vencidas y canceladas, porque son el historial de facturación de
// los usuarios y de ellas cuelgan los pagos.
import { useRef, useState } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Card } from '../../../core/components/Card';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { membershipService } from '../services/membershipService';
import type { PlanInput } from '../services/membershipService';
import type { Plan } from '../models/Membership';
import { PlanForm } from './PlanForm';
import { PlanAdminTable } from './PlanAdminTable';
import '../styles/_membership.scss';

/**
 * Arma el texto del cartel de confirmación de la baja.
 *
 * Si el plan tiene suscripciones, el diálogo deja de ser una confirmación y pasa
 * a explicar por qué no se puede borrar: la API rechaza la baja con un 409
 * mientras existan, para que eliminar un plan no se lleve en silencio el
 * historial de facturación de sus usuarios.
 *
 * @param plan plan que se eligió eliminar.
 */
function buildDeleteMessage(plan: Plan): string {
  if (plan.canBeDeleted) {
    return `¿Seguro que querés eliminar el plan "${plan.name}"? No tiene suscripciones asociadas y la acción no se puede deshacer.`;
  }

  return `El plan "${plan.name}" no se puede eliminar: tiene ${plan.subscribersLabel} asociadas, que son el historial de facturación de esos usuarios. Se puede editar su precio o su descripción, pero no darlo de baja.`;
}

export const PlanAdminSection = () => {
  const {
    data,
    isLoading,
    error,
    reload: loadPlans,
    setError,
  } = useFetch(() => membershipService.listPlans());
  const plans = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Plan que se está editando: si es null, el formulario es de alta.
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  // Plan elegido para eliminar, a la espera de que confirmen el diálogo.
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  // El formulario está arriba de la tabla: al elegir "Editar" en una fila de
  // abajo hay que traer la vista hasta acá, si no parece que el botón no hizo nada.
  const formRef = useRef<HTMLElement>(null);

  /** Carga el plan en el formulario y sube la vista hasta él. */
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreate = async (input: PlanInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await membershipService.createPlan(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por monto y así el plan nuevo aparece en su lugar.
      await loadPlans();
      setFeedback(`Se agregó el plan "${created.name}".`);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (input: PlanInput): Promise<boolean> => {
    if (!editingPlan) return false;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await membershipService.updatePlan(editingPlan.id, input);
      setEditingPlan(null);
      await loadPlans();
      // Cambiar el precio no toca lo ya cobrado: cada pago quedó registrado con
      // el importe del momento. Se aclara acá porque es lo primero que se
      // pregunta al editar un plan que ya tiene suscriptores.
      setFeedback(
        'Los cambios se guardaron. El monto nuevo rige para las próximas contrataciones: los pagos ya registrados no se modifican.'
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;

    const { id, name } = planToDelete;
    setPlanToDelete(null);
    setBusyPlanId(id);
    setError(null);
    setFeedback(null);

    try {
      await membershipService.removePlan(id);
      // Si se estaba editando justo ese plan, el formulario ya no aplica.
      setEditingPlan((current) => (current?.id === id ? null : current));
      await loadPlans();
      setFeedback(`Se eliminó el plan "${name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  };

  const blocksDelete = planToDelete !== null && !planToDelete.canBeDeleted;

  return (
    // La Card exterior es la que le da el marco al panel, igual que en
    // AdminMusicPanel y AdminUsersPanel. No es decorativa: los campos del
    // formulario tienen el mismo color que el fondo de la página, así que sin
    // este fondo más claro detrás se vuelven invisibles.
    <Card
      title="Planes de membresía"
      subtitle="Alta, edición y baja de los planes que se ofrecen en la página Pro."
    >
      <div className="plan-admin">
        {error && <Alert tone="error">{error}</Alert>}
        {feedback && <Alert tone="success">{feedback}</Alert>}

        {/* El formulario es el mismo para alta y edición. La key lo remonta al
            cambiar de plan, así arranca con el valor del que se eligió. */}
        {/* variant="plain": la Card va adentro del panel, que ya tiene su marco. */}
        <Card
          ref={formRef}
          variant="plain"
          title={editingPlan ? `Editando "${editingPlan.name}"` : 'Agregar plan'}
        >
          {editingPlan ? (
            <PlanForm
              key={editingPlan.id}
              initialValues={{
                name: editingPlan.name,
                // El monto vuelve a texto para el campo, con el punto como
                // separador decimal, que es lo que la API espera de vuelta. Los
                // centavos se escriben completos: un plan de 1750.5 tiene que
                // mostrarse "1750.50", porque "1750.5" se lee como otro precio.
                amount: Number.isInteger(editingPlan.amount)
                  ? String(editingPlan.amount)
                  : editingPlan.amount.toFixed(2),
                description: editingPlan.description ?? '',
              }}
              isSubmitting={isSubmitting}
              submitLabel="Guardar cambios"
              onSubmit={handleUpdate}
              onCancel={() => setEditingPlan(null)}
            />
          ) : (
            <PlanForm key="new" isSubmitting={isSubmitting} onSubmit={handleCreate} />
          )}
        </Card>

        <div className="plan-admin__toolbar">
          <h3 className="plan-admin__list-title">Planes del sistema ({plans.length})</h3>
        </div>

        {isLoading ? (
          <Loader message="Cargando planes..." />
        ) : plans.length === 0 ? (
          <p className="plan-admin__empty">
            Todavía no hay planes cargados. Agregá el primero con el formulario de arriba.
          </p>
        ) : (
          <PlanAdminTable
            plans={plans}
            busyPlanId={busyPlanId}
            onEdit={handleEdit}
            onDelete={setPlanToDelete}
          />
        )}

        {/* Con suscripciones asociadas el diálogo solo informa: confirmar no
            borraría nada, porque la API rechaza la baja mientras existan. */}
        <ConfirmDialog
          isOpen={planToDelete !== null}
          title={blocksDelete ? 'No se puede eliminar el plan' : 'Eliminar plan'}
          message={planToDelete ? buildDeleteMessage(planToDelete) : ''}
          confirmLabel={blocksDelete ? 'Entendido' : 'Eliminar'}
          cancelLabel={blocksDelete ? 'Cerrar' : 'Cancelar'}
          isDestructive={!blocksDelete}
          onConfirm={blocksDelete ? () => setPlanToDelete(null) : handleConfirmDelete}
          onCancel={() => setPlanToDelete(null)}
        />
      </div>
    </Card>
  );
};
