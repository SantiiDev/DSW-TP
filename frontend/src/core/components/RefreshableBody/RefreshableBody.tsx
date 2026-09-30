// Cuerpo de una lista que se vuelve a pedir sin que la tabla desaparezca.
//
// En la primera carga, cuando todavía no hay nada para mostrar, muestra el Loader.
// En las recargas (escribir en un buscador, cambiar un filtro, guardar, aprobar)
// mantiene lo que había, atenuado y con el spinner encima: reemplazar la tabla por
// "Cargando..." en cada recarga hacía que pareciera parpadear.
//
//   <RefreshableBody
//     isLoading={isLoading}
//     loadingMessage="Cargando géneros..."
//     isEmpty={genres.length === 0}
//     empty={<p>Todavía no hay géneros.</p>}
//   >
//     <GenreAdminTable ... />
//   </RefreshableBody>
import type { ReactNode } from 'react';
import { Loader } from '../Loader';
import './RefreshableBody.scss';

type RefreshableBodyProps = {
  isLoading: boolean;
  /** Mensaje del spinner, tanto en la primera carga como en las recargas. */
  loadingMessage: string;
  /** true si la lista no tiene nada para mostrar. */
  isEmpty: boolean;
  /** Qué se muestra cuando la lista está vacía (un texto o un EmptyState). */
  empty: ReactNode;
  /** La lista o tabla, cuando hay datos. */
  children: ReactNode;
};

export const RefreshableBody = ({
  isLoading,
  loadingMessage,
  isEmpty,
  empty,
  children,
}: RefreshableBodyProps) => {
  // Sin nada para mostrar no hay qué atenuar: va el Loader solo.
  if (isLoading && isEmpty) return <Loader message={loadingMessage} />;

  return (
    <div className="refreshable-body">
      <div
        className={
          isLoading
            ? 'refreshable-body__content refreshable-body__content--refreshing'
            : 'refreshable-body__content'
        }
      >
        {isEmpty ? empty : children}
      </div>

      {/* El spinner va aparte del contenido para que no se atenúe con él. */}
      {isLoading && (
        <div className="refreshable-body__spinner">
          <Loader message={loadingMessage} />
        </div>
      )}
    </div>
  );
};
