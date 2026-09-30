// Sección "Canciones" del panel de administración: el ABM completo del catálogo
// de canciones (alta, edición, baja y moderación de los aportes pendientes).
//
// Lo común con artistas y álbumes está compartido en core: las acciones en el
// hook useCatalogAdmin y la estructura en AdminListLayout. Acá queda lo propio
// de la canción: sus textos, su tabla y su formulario. Vive en la feature song
// para que el panel (AdminMusicPanel) solo tenga que montarla.
//
// A diferencia del álbum, la baja de una canción nunca se bloquea: sus reseñas se
// borran con ella (la FK de REVIEW hacia SONG es CASCADE), así que el diálogo es
// siempre una confirmación y avisa qué se va a perder.
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
import { songService } from '../../services/songService';
import type { SongInput } from '../../services/songService';
import { STATE_LABELS } from '../../models/Song';
import type { ContentState, Song } from '../../models/Song';
import { SongForm } from '../SongForm';
import { SongAdminTable } from '../SongAdminTable';

// Opciones del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en las aprobadas: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación.
const STATE_OPTIONS: SelectOption<ContentState>[] = (
  ['approved', 'pending', 'rejected'] as ContentState[]
).map((state) => ({
  value: state,
  label: STATE_LABELS[state],
}));

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene miles de canciones.
const PAGE_SIZE = 15;

/**
 * Arma el texto del cartel de confirmación de la baja.
 * @param song canción que se eligió eliminar.
 */
function buildDeleteMessage(song: Song): string {
  const base = `¿Seguro que querés eliminar "${song.title}"? La acción no se puede deshacer.`;
  if (song.reviewsCount === 0) return base;

  const reviews = song.reviewsCount === 1 ? '1 reseña' : `${song.reviewsCount} reseñas`;
  return `${base} Además tiene ${reviews} que se van a borrar junto con la canción.`;
}

/**
 * Pasa una canción a los valores que espera el formulario de edición.
 * Los campos numéricos van como string porque es lo que maneja un <input>.
 *
 * Una canción vieja sin álbum llega con 0, que el formulario muestra como "Elegí
 * un álbum" y no deja guardar hasta que se elija uno: editarla es justamente lo
 * que permite arreglar esas filas, porque la API ya no acepta canciones sueltas.
 */
function toFormValues(song: Song): SongInput {
  return {
    song_title: song.title,
    number_track: String(song.numberTrack),
    duration: song.duration === null ? '' : String(song.duration),
    id_album: song.album?.id ?? 0,
  };
}

export const SongAdminSection = () => {
  const { state: authState } = useAuth();
  const [stateFilter, setStateFilter] = useState<ContentState>('approved');
  const { search, setSearch, appliedSearch, clearSearch } = useAppliedSearch();

  // La clave junta los dos valores de los que depende el listado: cambiar
  // cualquiera de los dos lo vuelve a pedir (el filtrado lo resuelve la API) y
  // vuelve el "Ver más" a la primera página.
  const filterKey = `${stateFilter}|${appliedSearch}`;
  const { data, isLoading, error, reload, setError } = useFetch(
    () => songService.list({ state: stateFilter, title: appliedSearch || undefined }),
    filterKey
  );
  const songs = data ?? [];
  const { visibleItems, hasMore, showMore } = useShowMore(songs, PAGE_SIZE, filterKey);

  const admin = useCatalogAdmin<Song, SongInput>({
    service: songService,
    reload,
    setError,
    getName: (song) => song.title,
  });

  return (
    <>
      <AdminListLayout
        title={`Canciones del catálogo (${songs.length})`}
        error={error}
        feedback={admin.feedback}
        filterLabel="Estado"
        filter={
          <Select
            options={STATE_OPTIONS}
            value={stateFilter}
            onChange={(value: ContentState) => setStateFilter(value)}
            ariaLabel="Filtrar canciones por estado"
          />
        }
        action={
          <Button onClick={() => admin.openForm(null)}>
            <Plus size={16} aria-hidden="true" />
            Agregar canción
          </Button>
        }
        search={{
          value: search,
          placeholder: 'Buscar una canción por título...',
          onChange: setSearch,
          onClear: clearSearch,
        }}
        isLoading={isLoading}
        loadingMessage="Cargando canciones..."
        isEmpty={songs.length === 0}
        emptyMessage={
          appliedSearch
            ? `No hay canciones que coincidan con "${appliedSearch}".`
            : 'No hay canciones para mostrar con el estado elegido.'
        }
      >
        <SongAdminTable
          songs={visibleItems}
          currentUserId={authState.user?.id ?? 0}
          isAdmin={authState.user?.isAdmin ?? false}
          busySongId={admin.busyId}
          onEdit={admin.openForm}
          onDelete={admin.setToDelete}
          onApprove={(song) => void admin.moderate(song, 'approve')}
          onReject={(song) => void admin.moderate(song, 'reject')}
        />

        {hasMore && (
          <ShowMore shown={visibleItems.length} total={songs.length} noun="canciones" onShowMore={showMore} />
        )}
      </AdminListLayout>

      {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
          el título, los valores iniciales y a qué handler se manda. La key lo
          remonta al pasar de uno a otro, así arranca con los valores correctos. */}
      <FormModal
        isOpen={admin.isFormOpen}
        title={admin.editing ? `Editando "${admin.editing.title}"` : 'Agregar canción'}
        error={admin.formError}
        isBusy={admin.isSubmitting}
        onClose={admin.closeForm}
      >
        <SongForm
          key={admin.editing?.id ?? 'new'}
          initialValues={admin.editing ? toFormValues(admin.editing) : undefined}
          isSubmitting={admin.isSubmitting}
          submitLabel={admin.editing ? 'Guardar cambios' : undefined}
          onSubmit={admin.submit}
          onCancel={admin.closeForm}
        />
      </FormModal>

      <ConfirmDialog
        isOpen={admin.toDelete !== null}
        title="Eliminar canción"
        message={admin.toDelete ? buildDeleteMessage(admin.toDelete) : ''}
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={admin.confirmDelete}
        onCancel={() => admin.setToDelete(null)}
      />
    </>
  );
};
