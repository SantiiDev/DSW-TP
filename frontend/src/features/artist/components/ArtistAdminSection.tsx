// Sección "Artistas" del panel de administración: el ABM completo del catálogo
// de artistas (alta, edición, baja y moderación de los aportes pendientes).
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en ArtistForm,
// ArtistFilterBar y ArtistAdminTable. Vive en la feature artist y no en la feature
// user para que el panel (AdminMusicPanel) solo tenga que montarla.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { Select } from '../../../core/components/Select';
import { useFetch } from '../../../core/hooks/useFetch';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { artistService } from '../services/artistService';
import type { ArtistInput } from '../services/artistService';
import { STATE_LABELS } from '../models/Artist';
import type { Artist, ContentState } from '../models/Artist';
import { ArtistForm } from './ArtistForm';
import { ArtistFilterBar } from './ArtistFilterBar';
import { ArtistAdminTable } from './ArtistAdminTable';
import '../styles/_artist.scss';

// Orden del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en los aprobados: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación, que además tienen su
// propia pestaña en el panel.
const STATE_OPTIONS: ContentState[] = ['approved', 'pending', 'rejected'];

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene 88 artistas y sigue creciendo: mostrarlos todos de una hace una tabla
// larguísima que obliga a scrollear para llegar a cualquier cosa.
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
  const isAdmin = authState.user?.isAdmin ?? false;

  const [feedback, setFeedback] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<ContentState>('approved');
  // Lo que se está escribiendo en el buscador, y lo último que se buscó de verdad:
  // separarlos es lo que evita una request por cada tecla.
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  // Cuántas filas de la tabla se están mostrando (paginado del lado del cliente).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Artista que se está editando: si es null, el formulario es de alta.
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyArtistId, setBusyArtistId] = useState<number | null>(null);
  // Artista elegido para eliminar, a la espera de que confirmen el diálogo.
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);

  // El formulario vive en un modal: al panel se entra a mirar y a moderar mucho
  // más seguido que a cargar, así que el alta espera detrás de un botón en vez
  // de ocupar el lugar de arriba de la tabla.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Error del alta o de la edición. Va aparte del error de la sección porque se
  // muestra DENTRO del modal: si se mostrara afuera, quedaría tapado por el
  // propio formulario.
  const [formError, setFormError] = useState<string | null>(null);

  // Se vuelve a pedir cada vez que cambia el estado elegido o la búsqueda
  // aplicada: el filtrado lo resuelve la API, no el cliente.
  const {
    data,
    isLoading,
    error,
    reload: loadArtists,
    setError,
  } = useFetch(
    () => artistService.list({ state: stateFilter, name: appliedSearch || undefined }),
    // La clave junta los dos valores de los que depende el listado: cambiar
    // cualquiera de los dos tiene que volver a pedirlo.
    `${stateFilter}|${appliedSearch}`
  );
  const artists = data ?? [];

  /**
   * Aplica un filtro nuevo (estado o búsqueda) y vuelve a la primera página: el
   * "Ver más" de la lista anterior no tiene sentido sobre otro resultado.
   */
  const handleFilterByState = (value: ContentState) => {
    setStateFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearch = () => {
    setAppliedSearch(search.trim());
    setVisibleCount(PAGE_SIZE);
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
    setVisibleCount(PAGE_SIZE);
  };

  /** Abre el modal vacío, para cargar un artista nuevo. */
  const handleOpenCreate = () => {
    setEditingArtist(null);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  /** Abre el modal con los datos del artista elegido. */
  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleCreate = async (input: ArtistInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      const created = await artistService.create(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por nombre y así el artista nuevo aparece en su lugar.
      await loadArtists();
      setIsFormOpen(false);
      setFeedback(`Se agregó "${created.name}" al catálogo.`);
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

  const handleUpdate = async (input: ArtistInput): Promise<boolean> => {
    if (!editingArtist) return false;

    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      await artistService.update(editingArtist.id, input);
      setEditingArtist(null);
      await loadArtists();
      setIsFormOpen(false);
      setFeedback('Los cambios se guardaron.');
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Aprueba o rechaza un aporte pendiente.
   * @param artist artista a moderar.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleModerate = async (artist: Artist, decision: 'approve' | 'reject') => {
    setBusyArtistId(artist.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await artistService.approve(artist.id);
      else await artistService.reject(artist.id);

      await loadArtists();
      const label = decision === 'approve' ? 'aprobó' : 'rechazó';
      setFeedback(`Se ${label} el aporte "${artist.name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyArtistId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!artistToDelete) return;

    const { id, name } = artistToDelete;
    setArtistToDelete(null);
    setBusyArtistId(id);
    setError(null);
    setFeedback(null);

    try {
      await artistService.remove(id);
      // Si se estaba editando justo ese artista, el formulario ya no aplica.
      setEditingArtist((current) => (current?.id === id ? null : current));
      await loadArtists();
      setFeedback(`Se eliminó "${name}" del catálogo.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyArtistId(null);
    }
  };

  const hasAlbums = (artistToDelete?.albumsCount ?? 0) > 0;
  const visibleArtists = artists.slice(0, visibleCount);
  const hasMore = artists.length > visibleCount;

  return (
    <div className="artist-admin">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      <div className="artist-admin__toolbar">
        <h3 className="artist-admin__list-title">Artistas del catálogo ({artists.length})</h3>

        {/* Es un <span> y no un <label>: el desplegable propio es un botón, y un
            label envolviéndolo no lo describiría como sí lo hace su aria-label. */}
        <span className="artist-admin__filter">
          Estado
          <Select
            options={STATE_OPTIONS.map((state) => ({
              value: state,
              label: STATE_LABELS[state],
            }))}
            value={stateFilter}
            onChange={handleFilterByState}
            size="sm"
            ariaLabel="Filtrar artistas por estado"
          />
        </span>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus size={16} aria-hidden="true" />
          Agregar artista
        </Button>
      </div>

      <ArtistFilterBar
        value={search}
        hasActiveSearch={appliedSearch !== ''}
        onChange={setSearch}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {isLoading ? (
        <Loader message="Cargando artistas..." />
      ) : artists.length === 0 ? (
        <p className="artist-admin__empty">
          {appliedSearch
            ? `No hay artistas que coincidan con "${appliedSearch}".`
            : 'No hay artistas para mostrar con el estado elegido.'}
        </p>
      ) : (
        <>
          <ArtistAdminTable
            artists={visibleArtists}
            currentUserId={authState.user?.id ?? 0}
            isAdmin={isAdmin}
            busyArtistId={busyArtistId}
            onEdit={handleEdit}
            onDelete={setArtistToDelete}
            onApprove={(artist) => void handleModerate(artist, 'approve')}
            onReject={(artist) => void handleModerate(artist, 'reject')}
          />

          {hasMore && (
            <div className="artist-admin__more">
              <p className="artist-admin__more-count">
                Mostrando {visibleArtists.length} de {artists.length} artistas.
              </p>
              <Button
                variant="outline"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                Ver más artistas
              </Button>
            </div>
          )}
        </>
      )}

      {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
          el título, los valores iniciales y a qué handler se manda. La key lo
          remonta al pasar de uno a otro, así arranca con los valores correctos. */}
      <FormModal
        isOpen={isFormOpen}
        title={editingArtist ? `Editando a ${editingArtist.name}` : 'Agregar artista'}
        error={formError}
        isBusy={isSubmitting}
        onClose={() => setIsFormOpen(false)}
      >
        <ArtistForm
          key={editingArtist?.id ?? 'new'}
          initialValues={
            editingArtist
              ? { name: editingArtist.name, biography: editingArtist.biography ?? '' }
              : undefined
          }
          excludeArtistId={editingArtist?.id}
          isSubmitting={isSubmitting}
          submitLabel={editingArtist ? 'Guardar cambios' : undefined}
          onSubmit={editingArtist ? handleUpdate : handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormModal>

      {/* Con álbumes asociados el diálogo solo informa: confirmar no borraría
          nada, porque la API rechaza la baja mientras esos álbumes existan. */}
      <ConfirmDialog
        isOpen={artistToDelete !== null}
        title={hasAlbums ? 'No se puede eliminar el artista' : 'Eliminar artista'}
        message={artistToDelete ? buildDeleteMessage(artistToDelete) : ''}
        confirmLabel={hasAlbums ? 'Entendido' : 'Eliminar'}
        cancelLabel={hasAlbums ? 'Cerrar' : 'Cancelar'}
        isDestructive={!hasAlbums}
        onConfirm={hasAlbums ? () => setArtistToDelete(null) : handleConfirmDelete}
        onCancel={() => setArtistToDelete(null)}
      />
    </div>
  );
};
