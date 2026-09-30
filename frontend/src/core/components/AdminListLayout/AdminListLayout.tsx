// Estructura común de las tablas del panel de administración (artistas, álbumes
// y canciones): los avisos, la barra con el título, el filtro y el botón de alta,
// el buscador, y el cuerpo según el estado (cargando, vacío o la tabla).
//
// Es presentacional: no pide datos ni sabe qué se lista. Cada sección le pasa sus
// textos y su tabla como children, y se queda con el estado y las llamadas a la API.
//
//   <AdminListLayout
//     title={`Álbumes del catálogo (${albums.length})`}
//     filter={<Select ... />}
//     action={<Button>Agregar álbum</Button>}
//     search={{ value, placeholder, hasActiveSearch, onChange, onSearch, onClear }}
//     isLoading={isLoading}
//     loadingMessage="Cargando álbumes..."
//     isEmpty={albums.length === 0}
//     emptyMessage="No hay álbumes para mostrar."
//   >
//     <AlbumAdminTable ... />
//   </AdminListLayout>
import type { ComponentProps, ReactNode } from 'react';
import { Alert } from '../Alert';
import { Loader } from '../Loader';
import { SearchBar } from '../SearchBar';
import './AdminListLayout.scss';

type AdminListLayoutProps = {
  /** Título de la lista, con el total. */
  title: string;
  /** Error de la última operación, o null. */
  error: string | null;
  /** Confirmación de la última operación, o null. */
  feedback: string | null;
  /** Texto que acompaña al filtro. */
  filterLabel: string;
  /** El control del filtro (un Select). */
  filter: ReactNode;
  /** El botón de alta. */
  action: ReactNode;
  /** Props del buscador, tal cual las recibe SearchBar. */
  search: ComponentProps<typeof SearchBar>;
  isLoading: boolean;
  loadingMessage: string;
  isEmpty: boolean;
  emptyMessage: string;
  /** La tabla y su "Ver más". Solo se dibuja si hay filas. */
  children: ReactNode;
};

export const AdminListLayout = ({
  title,
  error,
  feedback,
  filterLabel,
  filter,
  action,
  search,
  isLoading,
  loadingMessage,
  isEmpty,
  emptyMessage,
  children,
}: AdminListLayoutProps) => {
  return (
    <div className="admin-list">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      <div className="admin-list__toolbar">
        <h3 className="admin-list__title">{title}</h3>

        {/* Es un <span> y no un <label>: el desplegable propio es un botón, y un
            label envolviéndolo no lo describiría como sí lo hace su aria-label. */}
        <span className="admin-list__filter">
          {filterLabel}
          {filter}
        </span>

        {action}
      </div>

      <SearchBar {...search} />

      {isLoading ? (
        <Loader message={loadingMessage} />
      ) : isEmpty ? (
        <p className="admin-list__empty">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
};
