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
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Card } from '../../../core/components/Card';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { membershipService } from '../services/membershipService';
import type { PlanInput } from '../services/membershipService';
import type { Plan } from '../models/Membership';
import { PlanForm } from './PlanForm';
import type { PlanFormValues } from './PlanForm';
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

/**
 * Pasa un plan a los valores que espera el formulario de edición.
 *
 * El monto vuelve a texto, con el punto como separador decimal, que es lo que la
 * API espera de vuelta. Los centavos se escriben completos: un plan de 1750.5
 * tiene que mostrarse "1750.50", porque "1750.5" se lee como otro precio.
 *
 * @param plan plan que se está editando.
 */
function toFormValues(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    amount: Number.isInteger(plan.amount) ? String(plan.amount) : plan.amount.toFixed(2),
    description: plan.description ?? '',
  };
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

  // El formulario vive en un modal: al panel se entra a mirar mucho más seguido
  // que a cargar, así que el alta espera detrás de un botón en vez de ocupar el
  // lugar de arriba de la tabla.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Error del alta o de la edición. Va aparte del error de la sección porque se
  // muestra DENTRO del modal: si se mostrara afuera, quedaría tapado por el
  // propio formulario.
  const [formError, setFormError] = useState<string | null>(null);

  /** Abre el modal vacío, para cargar un plan nuevo. */
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  /** Abre el modal con los datos del plan elegido. */
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleCreate = async (input: PlanInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      const created = await membershipService.createPlan(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por monto y así el plan nuevo aparece en su lugar.
      await loadPlans();
      setIsFormOpen(false);
      setFeedback(`Se agregó el plan "${created.name}".`);
      return true;
    } catch (err) {
      // El modal queda abierto con lo que se había escrito: cerrarlo obligaría a
      // tipear todo de nuevo por un nombre repetido.
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (input: PlanInput): Promise<boolean> => {
    if (!editingPlan) return false;

    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      await membershipService.updatePlan(editingPlan.id, input);
      setEditingPlan(null);
      await loadPlans();
      setIsFormOpen(false);
      // Cambiar el precio no toca lo ya cobrado: cada pago quedó registrado con
      // el importe del momento. Se aclara acá porque es lo primero que se
      // pregunta al editar un plan que ya tiene suscriptores.
      setFeedback(
        'Los cambios se guardaron. El monto nuevo rige para las próximas contrataciones: los pagos ya registrados no se modifican.'
      );
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
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

        <div className="plan-admin__toolbar">
          <h3 className="plan-admin__list-title">Planes del sistema ({plans.length})</h3>

          <Button onClick={handleOpenCreate}>
            <Plus size={16} aria-hidden="true" />
            Agregar plan
          </Button>
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

        {/* El mismo modal sirve para el alta y para la edición: lo que cambia
            son el título, los valores iniciales y a qué handler se manda. La key
            lo remonta al pasar de uno a otro. */}
        <FormModal
          isOpen={isFormOpen}
          title={editingPlan ? `Editando "${editingPlan.name}"` : 'Agregar plan'}
          error={formError}
          isBusy={isSubmitting}
          onClose={() => setIsFormOpen(false)}
        >
          <PlanForm
            key={editingPlan?.id ?? 'new'}
            initialValues={editingPlan ? toFormValues(editingPlan) : undefined}
            isSubmitting={isSubmitting}
            submitLabel={editingPlan ? 'Guardar cambios' : undefined}
            onSubmit={editingPlan ? handleUpdate : handleCreate}
            onCancel={() => setIsFormOpen(false)}
          />
        </FormModal>

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
