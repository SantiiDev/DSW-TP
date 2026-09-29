// Estado vacío reutilizable: se muestra cuando una sección no tiene datos que
// listar. Existe para que "no hay nada" se vea igual en todo el sitio y nunca
// quede un bloque en blanco sin explicación.
import type { ReactNode } from 'react';
import './_empty-state.scss';

type EmptyStateProps = {
  /** Ícono decorativo, normalmente uno de lucide-react. */
  icon?: ReactNode;
  title: string;
  message?: string;
  /** Acción opcional (un botón o link) para que el usuario salga del vacío. */
  action?: ReactNode;
};

export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => {
  return (
    <div className="empty-state">
      {icon && (
        <span className="empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="empty-state__title">{title}</p>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};
