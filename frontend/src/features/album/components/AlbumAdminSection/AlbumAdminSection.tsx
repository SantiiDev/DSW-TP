// Sección "Álbumes" del panel de administración: el ABM completo del catálogo de
// álbumes (alta, edición, baja y moderación de los aportes pendientes).
//
// Lo común con artistas y canciones está compartido en core: las acciones en el
// hook useCatalogAdmin y la estructura en AdminListLayout. Acá queda lo propio
// del álbum: sus textos, su tabla, su formulario y cuándo no se puede borrar.
// Vive en la feature album para que el panel (AdminMusicPanel) solo tenga que
// montarla.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminListLayout } from '../../../../core/components/AdminListLayout';
import { Button } from '../../../../core/components/Button';
import { FormModal } from '../../../../core/components/FormModal';
import { ConfirmDialog } from '../../../../core/components/Modal';
import { Select } from '../../../../core/components/Select';
import type { SelectOption } from '../../../../core/components/Select';
import { ShowMore } from '../../../../core/components/ShowMore';
import { useAppliedSearch } from '../../../../core/hooks/useAppliedSearch';
import { useCatalogAdmin } from '../../../../core/hooks/useCatalogAdmin';
import { useFetch } from '../../../../core/hooks/useFetch';
import { useShowMore } from '../../../../core/hooks/useShowMore';
import { useAuth } from '../../../../core/context/AuthContext';
import { albumService } from '../../services/albumService';
import type { AlbumInput } from '../../services/albumService';
import { STATE_LABELS } from '../../models/Album';
import type { Album, ContentState } from '../../models/Album';
import { AlbumForm } from '../AlbumForm';
import { AlbumAdminTable } from '../AlbumAdminTable';

// Opciones del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en los aprobados: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación.
const STATE_OPTIONS: SelectOption<ContentState>[] = (
  ['approved', 'pending', 'rejected'] as ContentState[]
).map((state) => ({
  value: state,
  label: STATE_LABELS[state],
}));

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene cientos de álbumes.
const PAGE_SIZE = 15;

/**
 * Arma el texto del cartel de confirmación de la baja.
 *
 * Si el álbum tiene canciones o reseñas, el diálogo deja de ser una confirmación
 * y pasa a explicar por qué no se puede borrar: las FK de SONG y de REVIEW hacia
 * ALBUMS son RESTRICT y la API rechaza la baja con un 409 mientras esas filas
 * existan.
 *
 * @param album álbum que se eligió eliminar.
 */
function buildDeleteMessage(album: Album): string {
  if (album.canBeDeleted) {
    return `¿Seguro que querés eliminar "${album.title}"? No tiene canciones ni reseñas asociadas y la acción no se puede deshacer.`;
  }

  const blockers: string[] = [];
  if (album.songsCount > 0) blockers.push(album.songsLabel);
  if (album.reviewsCount > 0) {
    blockers.push(album.reviewsCount === 1 ? '1 reseña' : `${album.reviewsCount} reseñas`);
  }

  return `"${album.title}" no se puede eliminar todavía: tiene ${blockers.join(
    ' y '
  )} en el catálogo. Hay que dar de baja eso antes de borrar el álbum.`;
}

/**
 * Pasa un álbum a los valores que espera el formulario de edición.
 * Los campos de texto van como string (incluido el año, que en el modelo es un
 * número o null) porque es lo que maneja un <input>.
 */
function toFormValues(album: Album): AlbumInput {
  return {
    title: album.title,
    release_year: album.releaseYear === null ? '' : String(album.releaseYear),
    url_cover: album.urlCover ?? '',
    id_artist: album.artist?.id ?? 0,
    genre_ids: album.genres.map((genre) => genre.id),
  };
}

export const AlbumAdminSection = () => {
  const { state: authState } = useAuth();
  const [stateFilter, setStateFilter] = useState<ContentState>('approved');
  const { search, setSearch, appliedSearch, applySearch, clearSearch } = useAppliedSearch();

  // La clave junta los dos valores de los que depende el listado: cambiar
  // cualquiera de los dos lo vuelve a pedir (el filtrado lo resuelve la API) y
  // vuelve el "Ver más" a la primera página.
  const filterKey = `${stateFilter}|${appliedSearch}`;
  const { data, isLoading, error, reload, setError } = useFetch(
    () => albumService.list({ state: stateFilter, title: appliedSearch || undefined }),
    filterKey
  );
  const albums = data ?? [];
  const { visibleItems, hasMore, showMore } = useShowMore(albums, PAGE_SIZE, filterKey);

  const admin = useCatalogAdmin<Album, AlbumInput>({
    service: albumService,
    reload,
    setError,
    getName: (album) => album.title,
  });

  const isBlocked = admin.toDelete !== null && !admin.toDelete.canBeDeleted;

  return (
    <>
      <AdminListLayout
        title={`Álbumes del catálogo (${albums.length})`}
        error={error}
        feedback={admin.feedback}
        filterLabel="Estado"
        filter={
          <Select
            options={STATE_OPTIONS}
            value={stateFilter}
            onChange={(value: ContentState) => setStateFilter(value)}
            ariaLabel="Filtrar álbumes por estado"
          />
        }
        action={
          <Button onClick={() => admin.openForm(null)}>
            <Plus size={16} aria-hidden="true" />
            Agregar álbum
          </Button>
        }
        search={{
          value: search,
          placeholder: 'Buscar un álbum por título...',
          hasActiveSearch: appliedSearch !== '',
          onChange: setSearch,
          onSearch: applySearch,
          onClear: clearSearch,
        }}
        isLoading={isLoading}
        loadingMessage="Cargando álbumes..."
        isEmpty={albums.length === 0}
        emptyMessage={
          appliedSearch
            ? `No hay álbumes que coincidan con "${appliedSearch}".`
            : 'No hay álbumes para mostrar con el estado elegido.'
        }
      >
        <AlbumAdminTable
          albums={visibleItems}
          currentUserId={authState.user?.id ?? 0}
          isAdmin={authState.user?.isAdmin ?? false}
          busyAlbumId={admin.busyId}
          onEdit={admin.openForm}
          onDelete={admin.setToDelete}
          onApprove={(album) => void admin.moderate(album, 'approve')}
          onReject={(album) => void admin.moderate(album, 'reject')}
        />

        {hasMore && (
          <ShowMore shown={visibleItems.length} total={albums.length} noun="álbumes" onShowMore={showMore} />
        )}
      </AdminListLayout>

      {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
          el título, los valores iniciales y a qué handler se manda. La key lo
          remonta al pasar de uno a otro, así arranca con los valores correctos. */}
      <FormModal
        isOpen={admin.isFormOpen}
        title={admin.editing ? `Editando "${admin.editing.title}"` : 'Agregar álbum'}
        error={admin.formError}
        isBusy={admin.isSubmitting}
        onClose={admin.closeForm}
      >
        <AlbumForm
          key={admin.editing?.id ?? 'new'}
          initialValues={admin.editing ? toFormValues(admin.editing) : undefined}
          isSubmitting={admin.isSubmitting}
          submitLabel={admin.editing ? 'Guardar cambios' : undefined}
          onSubmit={admin.submit}
          onCancel={admin.closeForm}
        />
      </FormModal>

      {/* Con canciones o reseñas asociadas el diálogo solo informa: confirmar no
          borraría nada, porque la API rechaza la baja mientras existan. */}
      <ConfirmDialog
        isOpen={admin.toDelete !== null}
        title={isBlocked ? 'No se puede eliminar el álbum' : 'Eliminar álbum'}
        message={admin.toDelete ? buildDeleteMessage(admin.toDelete) : ''}
        confirmLabel={isBlocked ? 'Entendido' : 'Eliminar'}
        cancelLabel={isBlocked ? 'Cerrar' : 'Cancelar'}
        isDestructive={!isBlocked}
        onConfirm={isBlocked ? () => admin.setToDelete(null) : admin.confirmDelete}
        onCancel={() => admin.setToDelete(null)}
      />
    </>
  );
};
