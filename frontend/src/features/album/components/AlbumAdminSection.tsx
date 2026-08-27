// Sección "Álbumes" del panel de administración: el ABM completo del catálogo de
// álbumes (alta, edición, baja y moderación de los aportes pendientes).
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en AlbumForm,
// SearchBar y AlbumAdminTable. Vive en la feature album y no en la feature user
// para que el panel (AdminMusicPanel) solo tenga que montarla.
import { useRef, useState } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Card } from '../../../core/components/Card';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { SearchBar } from '../../../core/components/SearchBar';
import { Select } from '../../../core/components/Select';
import { useFetch } from '../../../core/hooks/useFetch';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { albumService } from '../services/albumService';
import type { AlbumInput } from '../services/albumService';
import { STATE_LABELS } from '../models/Album';
import type { Album, ContentState } from '../models/Album';
import { AlbumForm } from './AlbumForm';
import { AlbumAdminTable } from './AlbumAdminTable';
import '../styles/_album.scss';

// Orden del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en los aprobados: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación.
const STATE_OPTIONS: ContentState[] = ['approved', 'pending', 'rejected'];

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene cientos de álbumes: mostrarlos todos de una hace una tabla larguísima que
// obliga a scrollear para llegar a cualquier cosa.
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
  // Álbum que se está editando: si es null, el formulario es de alta.
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyAlbumId, setBusyAlbumId] = useState<number | null>(null);
  // Álbum elegido para eliminar, a la espera de que confirmen el diálogo.
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  // El formulario está arriba de todo y la tabla puede ser larga: al elegir
  // "Editar" en una fila de abajo hay que traer la vista hasta acá, si no parece
  // que el botón no hizo nada.
  const formRef = useRef<HTMLElement>(null);

  // Se vuelve a pedir cada vez que cambia el estado elegido o la búsqueda
  // aplicada: el filtrado lo resuelve la API, no el cliente.
  const {
    data,
    isLoading,
    error,
    reload: loadAlbums,
    setError,
  } = useFetch(
    () => albumService.list({ state: stateFilter, title: appliedSearch || undefined }),
    // La clave junta los dos valores de los que depende el listado: cambiar
    // cualquiera de los dos tiene que volver a pedirlo.
    `${stateFilter}|${appliedSearch}`
  );
  const albums = data ?? [];

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

  /** Carga el álbum en el formulario y sube la vista hasta él. */
  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreate = async (input: AlbumInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await albumService.create(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por título y así el álbum nuevo aparece en su lugar.
      await loadAlbums();
      setFeedback(`Se agregó "${created.title}" al catálogo.`);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (input: AlbumInput): Promise<boolean> => {
    if (!editingAlbum) return false;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await albumService.update(editingAlbum.id, input);
      setEditingAlbum(null);
      await loadAlbums();
      setFeedback('Los cambios se guardaron.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Aprueba o rechaza un aporte pendiente.
   * @param album álbum a moderar.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleModerate = async (album: Album, decision: 'approve' | 'reject') => {
    setBusyAlbumId(album.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await albumService.approve(album.id);
      else await albumService.reject(album.id);

      await loadAlbums();
      const label = decision === 'approve' ? 'aprobó' : 'rechazó';
      setFeedback(`Se ${label} el aporte "${album.title}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!albumToDelete) return;

    const { id, title } = albumToDelete;
    setAlbumToDelete(null);
    setBusyAlbumId(id);
    setError(null);
    setFeedback(null);

    try {
      await albumService.remove(id);
      // Si se estaba editando justo ese álbum, el formulario ya no aplica.
      setEditingAlbum((current) => (current?.id === id ? null : current));
      await loadAlbums();
      setFeedback(`Se eliminó "${title}" del catálogo.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  const isBlocked = albumToDelete !== null && !albumToDelete.canBeDeleted;
  const visibleAlbums = albums.slice(0, visibleCount);
  const hasMore = albums.length > visibleCount;

  return (
    <div className="album-admin">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {/* El formulario es el mismo para alta y edición. La key lo remonta al
          cambiar de álbum, así arranca con los valores del que se eligió. */}
      {/* variant="plain": esta sección ya vive adentro de la Card del panel de
          música, y dos marcos anidados del mismo color se ven mal. */}
      <Card
        ref={formRef}
        variant="plain"
        title={editingAlbum ? `Editando "${editingAlbum.title}"` : 'Agregar álbum'}
      >
        {editingAlbum ? (
          <AlbumForm
            key={editingAlbum.id}
            initialValues={toFormValues(editingAlbum)}
            isSubmitting={isSubmitting}
            submitLabel="Guardar cambios"
            onSubmit={handleUpdate}
            onCancel={() => setEditingAlbum(null)}
          />
        ) : (
          <AlbumForm key="new" isSubmitting={isSubmitting} onSubmit={handleCreate} />
        )}
      </Card>

      <div className="album-admin__toolbar">
        <h3 className="album-admin__list-title">Álbumes del catálogo ({albums.length})</h3>

        {/* Es un <span> y no un <label>: el desplegable propio es un botón, y un
            label envolviéndolo no lo describiría como sí lo hace su aria-label. */}
        <span className="album-admin__filter">
          Estado
          <Select
            options={STATE_OPTIONS.map((state) => ({
              value: state,
              label: STATE_LABELS[state],
            }))}
            value={stateFilter}
            onChange={handleFilterByState}
            size="sm"
            ariaLabel="Filtrar álbumes por estado"
          />
        </span>
      </div>

      <SearchBar
        value={search}
        placeholder="Buscar un álbum por título..."
        hasActiveSearch={appliedSearch !== ''}
        onChange={setSearch}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {isLoading ? (
        <Loader message="Cargando álbumes..." />
      ) : albums.length === 0 ? (
        <p className="album-admin__empty">
          {appliedSearch
            ? `No hay álbumes que coincidan con "${appliedSearch}".`
            : 'No hay álbumes para mostrar con el estado elegido.'}
        </p>
      ) : (
        <>
          <AlbumAdminTable
            albums={visibleAlbums}
            currentUserId={authState.user?.id ?? 0}
            isAdmin={isAdmin}
            busyAlbumId={busyAlbumId}
            onEdit={handleEdit}
            onDelete={setAlbumToDelete}
            onApprove={(album) => void handleModerate(album, 'approve')}
            onReject={(album) => void handleModerate(album, 'reject')}
          />

          {hasMore && (
            <div className="album-admin__more">
              <p className="album-admin__more-count">
                Mostrando {visibleAlbums.length} de {albums.length} álbumes.
              </p>
              <Button
                variant="outline"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                Ver más álbumes
              </Button>
            </div>
          )}
        </>
      )}

      {/* Con canciones o reseñas asociadas el diálogo solo informa: confirmar no
          borraría nada, porque la API rechaza la baja mientras existan. */}
      <ConfirmDialog
        isOpen={albumToDelete !== null}
        title={isBlocked ? 'No se puede eliminar el álbum' : 'Eliminar álbum'}
        message={albumToDelete ? buildDeleteMessage(albumToDelete) : ''}
        confirmLabel={isBlocked ? 'Entendido' : 'Eliminar'}
        cancelLabel={isBlocked ? 'Cerrar' : 'Cancelar'}
        isDestructive={!isBlocked}
        onConfirm={isBlocked ? () => setAlbumToDelete(null) : handleConfirmDelete}
        onCancel={() => setAlbumToDelete(null)}
      />
    </div>
  );
};
