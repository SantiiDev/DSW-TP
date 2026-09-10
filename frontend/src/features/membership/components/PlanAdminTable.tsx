// Tabla de planes de membresía del panel de administración: muestra cada plan con
// su precio, su descripción y cuántas suscripciones tiene, más los íconos de
// editar y eliminar.
//
// Solo define sus columnas: el armado de la tabla (wrapper con scroll, cabecera,
// filas) lo pone DataTable, el mismo que usan las tablas de géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (PlanAdminSection) con los handlers que recibe.
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { IconButton } from '../../../core/components/IconButton';
import type { Plan } from '../models/Membership';

type PlanAdminTableProps = {
  plans: Plan[];
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busyPlanId: number | null;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
};

export const PlanAdminTable = ({
  plans,
  busyPlanId,
  onEdit,
  onDelete,
}: PlanAdminTableProps) => {
  const columns: DataTableColumn<Plan>[] = [
    {
      key: 'name',
      header: 'Plan',
      render: (plan) => (
        <div className="plan-admin__name-cell">
          <span className="data-table__name-cell">{plan.name}</span>
          <Badge tone={plan.isPaid ? 'info' : 'neutral'}>
            {plan.isPaid ? 'Pago' : 'Gratuito'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Precio',
      render: (plan) => plan.priceLabel,
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (plan) => (
        <span className="plan-admin__description-cell">
          {plan.description ?? <span className="plan-admin__no-description">Sin descripción</span>}
        </span>
      ),
    },
    {
      key: 'subscribers',
      header: 'Suscripciones',
      render: (plan) => plan.subscribers,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (plan) => {
        const isBusy = busyPlanId === plan.id;

        return (
          <div className="data-table__actions">
            <IconButton
              icon={<Pencil size={16} aria-hidden="true" />}
              label="Editar"
              disabled={isBusy}
              onClick={() => onEdit(plan)}
            />

            {/* El botón se muestra siempre, también cuando el plan tiene
                suscripciones: en ese caso el diálogo explica por qué no se puede
                borrar, que es más útil que un botón ausente sin motivo. Es el
                mismo criterio que la tabla de géneros. */}
            <IconButton
              icon={<Trash2 size={16} aria-hidden="true" />}
              label="Eliminar"
              tone="danger"
              disabled={isBusy}
              onClick={() => onDelete(plan)}
            />
          </div>
        );
      },
    },
  ];

  // align="top": la columna de descripción puede ocupar dos líneas y el resto de
  // las celdas tienen que arrancar arriba, no centrarse contra ella.
  return (
    <DataTable columns={columns} rows={plans} getRowKey={(plan) => plan.id} align="top" />
  );
};
