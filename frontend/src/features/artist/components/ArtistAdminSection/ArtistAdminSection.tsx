// Sección "Artistas" del panel de administración: el ABM completo del catálogo
// de artistas (alta, edición, baja y moderación de los aportes pendientes).
//
// Lo común con álbumes y canciones está compartido en core: las acciones en el
// hook useCatalogAdmin y la estructura en AdminListLayout. Acá queda lo propio
// del artista: sus textos, su tabla, su formulario y cuándo no se puede borrar.
// Vive en la feature artist para que el panel (AdminMusicPanel) solo tenga que
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
import { artistService } from '../../services/artistService';
import type { ArtistInput } from '../../services/artistService';
import { STATE_LABELS } from '../../models/Artist';
import type { Artist, ContentState } from '../../models/Artist';
import { ArtistForm } from '../ArtistForm';
import { ArtistAdminTable } from '../ArtistAdminTable';

// Opciones del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en los aprobados: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación, que además tienen su
// propia pestaña en el panel.
const STATE_OPTIONS: SelectOption<ContentState>[] = (
  ['approved', 'pending', 'rejected'] as ContentState[]
).map((state) => ({
  value: state,
  label: STATE_LABELS[state],
}));

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene 88 artistas y sigue creciendo.
const PAGE_SIZE = 15;

/**
 * Arma el texto del cartel de confirmación de la baja.
 *
 * Si el artista tiene álbumes, el diálogo deja de ser una confirmación y pasa a
 * explicar por qué no se puede borrar: la FK de ALBUMS es RESTRICT y la API
 * rechaza la baja con un 409 mientras esos álbumes existan.
 *
 * @param artist artista que se eligió eliminar.
 */
function buildDeleteMessage(artist: Artist): string {
  if (artist.albumsCount === 0) {
    return `¿Seguro que querés eliminar a ${artist.name}? No tiene álbumes asociados y la acción no se puede deshacer.`;
  }

  const titles = artist.albums.map((album) => album.title).join(', ');
  return `${artist.name} no se puede eliminar todavía: tiene ${artist.albumsLabel} en el catálogo (${titles}). Hay que dar de baja esos álbumes antes de borrar al artista.`;
}

export const ArtistAdminSection = () => {
  const { state: authState } = useAuth();
  const [stateFilter, setStateFilter] = useState<ContentState>('approved');
  const { search, setSearch, appliedSearch, clearSearch } = useAppliedSearch();

  // La clave junta los dos valores de los que depende el listado: cambiar
  // cualquiera de los dos lo vuelve a pedir (el filtrado lo resuelve la API) y
  // vuelve el "Ver más" a la primera página.
  const filterKey = `${stateFilter}|${appliedSearch}`;
  const { data, isLoading, error, reload, setError } = useFetch(
    () => artistService.list({ state: stateFilter, name: appliedSearch || undefined }),
    filterKey
  );
  const artists = data ?? [];
  const { visibleItems, hasMore, showMore } = useShowMore(artists, PAGE_SIZE, filterKey);

  const admin = useCatalogAdmin<Artist, ArtistInput>({
    service: artistService,
    reload,
    setError,
    getName: (artist) => artist.name,
  });

  const hasAlbums = (admin.toDelete?.albumsCount ?? 0) > 0;

  return (
    <>
      <AdminListLayout
        title={`Artistas del catálogo (${artists.length})`}
        error={error}
        feedback={admin.feedback}
        filterLabel="Estado"
        filter={
          <Select
            options={STATE_OPTIONS}
            value={stateFilter}
            onChange={(value: ContentState) => setStateFilter(value)}
            ariaLabel="Filtrar artistas por estado"
          />
        }
        action={
          <Button onClick={() => admin.openForm(null)}>
            <Plus size={16} aria-hidden="true" />
            Agregar artista
          </Button>
        }
        search={{
          value: search,
          placeholder: 'Buscar un artista por nombre...',
          onChange: setSearch,
          onClear: clearSearch,
        }}
        isLoading={isLoading}
        loadingMessage="Cargando artistas..."
        isEmpty={artists.length === 0}
        emptyMessage={
          appliedSearch
            ? `No hay artistas que coincidan con "${appliedSearch}".`
            : 'No hay artistas para mostrar con el estado elegido.'
        }
      >
        <ArtistAdminTable
          artists={visibleItems}
          currentUserId={authState.user?.id ?? 0}
          isAdmin={authState.user?.isAdmin ?? false}
          busyArtistId={admin.busyId}
          onEdit={admin.openForm}
          onDelete={admin.setToDelete}
          onApprove={(artist) => void admin.moderate(artist, 'approve')}
          onReject={(artist) => void admin.moderate(artist, 'reject')}
        />

        {hasMore && (
          <ShowMore shown={visibleItems.length} total={artists.length} noun="artistas" onShowMore={showMore} />
        )}
      </AdminListLayout>

      {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
          el título, los valores iniciales y a qué handler se manda. La key lo
          remonta al pasar de uno a otro, así arranca con los valores correctos. */}
      <FormModal
        isOpen={admin.isFormOpen}
        title={admin.editing ? `Editando a ${admin.editing.name}` : 'Agregar artista'}
        error={admin.formError}
        isBusy={admin.isSubmitting}
        onClose={admin.closeForm}
      >
        <ArtistForm
          key={admin.editing?.id ?? 'new'}
          initialValues={
            admin.editing
              ? { name: admin.editing.name, biography: admin.editing.biography ?? '' }
              : undefined
          }
          excludeArtistId={admin.editing?.id}
          isSubmitting={admin.isSubmitting}
          submitLabel={admin.editing ? 'Guardar cambios' : undefined}
          onSubmit={admin.submit}
          onCancel={admin.closeForm}
        />
      </FormModal>

      {/* Con álbumes asociados el diálogo solo informa: confirmar no borraría
          nada, porque la API rechaza la baja mientras esos álbumes existan. */}
      <ConfirmDialog
        isOpen={admin.toDelete !== null}
        title={hasAlbums ? 'No se puede eliminar el artista' : 'Eliminar artista'}
        message={admin.toDelete ? buildDeleteMessage(admin.toDelete) : ''}
        confirmLabel={hasAlbums ? 'Entendido' : 'Eliminar'}
        cancelLabel={hasAlbums ? 'Cerrar' : 'Cancelar'}
        isDestructive={!hasAlbums}
        onConfirm={hasAlbums ? () => admin.setToDelete(null) : admin.confirmDelete}
        onCancel={() => admin.setToDelete(null)}
      />
    </>
  );
};
