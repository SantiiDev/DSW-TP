// Barra de cambios sin guardar del panel de administración.
//
// Los cambios de rol no se mandan a la API apenas se elige una opción: quedan en
// borrador hasta que el admin los confirma acá. Así puede revisar varias filas
// antes de aplicar, y sobre todo puede arrepentirse sin haber tocado la base.
//
// Es presentacional: no conoce la API ni los usuarios, solo avisa al padre
// (AdminUsersPanel) con onSave / onDiscard.
import { Save, Undo2 } from 'lucide-react';
import { Button } from '../../../core/components/Button';

type RoleChangesBarProps = {
  /** Cantidad de roles modificados y todavía sin guardar. */
  count: number;
  /** true mientras se están mandando los cambios: bloquea los dos botones. */
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const RoleChangesBar = ({ count, isSaving, onSave, onDiscard }: RoleChangesBarProps) => {
  // Sin cambios pendientes la barra no existe: no se muestra vacía ni deshabilitada.
  if (count === 0) return null;

  const label = count === 1 ? '1 cambio sin guardar' : `${count} cambios sin guardar`;

  return (
    // role="status" hace que un lector de pantalla anuncie la aparición de la barra.
    <div className="admin-users__changes-bar" role="status">
      <p className="admin-users__changes-text">
        {label}. Revisá los roles marcados y confirmá para aplicarlos.
      </p>

      <div className="admin-users__changes-actions">
        <Button variant="subtle" onClick={onDiscard} disabled={isSaving}>
          <Undo2 size={16} aria-hidden="true" />
          Descartar
        </Button>

        <Button onClick={onSave} disabled={isSaving}>
          <Save size={16} aria-hidden="true" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};
