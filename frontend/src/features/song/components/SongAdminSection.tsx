// Sección "Canciones" del panel de administración: el ABM completo del catálogo
// de canciones (alta, edición, baja y moderación de los aportes pendientes).
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en SongForm,
// SearchBar y SongAdminTable. Vive en la feature song y no en la feature user
// para que el panel (AdminMusicPanel) solo tenga que montarla.
//
// A diferencia del álbum, la baja de una canción nunca se bloquea: sus reseñas se
// borran con ella (la FK de REVIEW hacia SONG es CASCADE), así que el diálogo es
// siempre una confirmación y avisa qué se va a perder.
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
import { songService } from '../services/songService';
import type { SongInput } from '../services/songService';
import { STATE_LABELS } from '../models/Song';
import type { ContentState, Song } from '../models/Song';
import { SongForm } from './SongForm';
import { SongAdminTable } from './SongAdminTable';
import '../styles/_song.scss';

// Orden del selector de estado. La tabla muestra siempre un estado por vez, y
// arranca en las aprobadas: es el catálogo publicado, lo que se administra todo
// el tiempo. Los otros dos son las colas de moderación.
const STATE_OPTIONS: ContentState[] = ['approved', 'pending', 'rejected'];

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". El catálogo
// tiene miles de canciones: mostrarlas todas de una hace una tabla imposible de
// recorrer.
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
  // Canción que se está editando: si es null, el formulario es de alta.
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busySongId, setBusySongId] = useState<number | null>(null);
  // Canción elegida para eliminar, a la espera de que confirmen el diálogo.
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);

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
    reload: loadSongs,
    setError,
  } = useFetch(
    () => songService.list({ state: stateFilter, title: appliedSearch || undefined }),
    // La clave junta los dos valores de los que depende el listado: cambiar
    // cualquiera de los dos tiene que volver a pedirlo.
    `${stateFilter}|${appliedSearch}`
  );
  const songs = data ?? [];

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

  /** Carga la canción en el formulario y sube la vista hasta él. */
  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreate = async (input: SongInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await songService.create(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por álbum y pista, y así la canción nueva aparece en su lugar.
      await loadSongs();
      setFeedback(`Se agregó "${created.title}" al catálogo.`);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (input: SongInput): Promise<boolean> => {
    if (!editingSong) return false;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await songService.update(editingSong.id, input);
      setEditingSong(null);
      await loadSongs();
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
   * @param song canción a moderar.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleModerate = async (song: Song, decision: 'approve' | 'reject') => {
    setBusySongId(song.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await songService.approve(song.id);
      else await songService.reject(song.id);

      await loadSongs();
      const label = decision === 'approve' ? 'aprobó' : 'rechazó';
      setFeedback(`Se ${label} el aporte "${song.title}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusySongId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;

    const { id, title } = songToDelete;
    setSongToDelete(null);
    setBusySongId(id);
    setError(null);
    setFeedback(null);

    try {
      await songService.remove(id);
      // Si se estaba editando justo esa canción, el formulario ya no aplica.
      setEditingSong((current) => (current?.id === id ? null : current));
      await loadSongs();
      setFeedback(`Se eliminó "${title}" del catálogo.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusySongId(null);
    }
  };

  const visibleSongs = songs.slice(0, visibleCount);
  const hasMore = songs.length > visibleCount;

  return (
    <div className="song-admin">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {/* El formulario es el mismo para alta y edición. La key lo remonta al
          cambiar de canción, así arranca con los valores de la que se eligió. */}
      {/* variant="plain": esta sección ya vive adentro de la Card del panel de
          música, y dos marcos anidados del mismo color se ven mal. */}
      <Card
        ref={formRef}
        variant="plain"
        title={editingSong ? `Editando "${editingSong.title}"` : 'Agregar canción'}
      >
        {editingSong ? (
          <SongForm
            key={editingSong.id}
            initialValues={toFormValues(editingSong)}
            isSubmitting={isSubmitting}
            submitLabel="Guardar cambios"
            onSubmit={handleUpdate}
            onCancel={() => setEditingSong(null)}
          />
        ) : (
          <SongForm key="new" isSubmitting={isSubmitting} onSubmit={handleCreate} />
        )}
      </Card>

      <div className="song-admin__toolbar">
        <h3 className="song-admin__list-title">Canciones del catálogo ({songs.length})</h3>

        {/* Es un <span> y no un <label>: el desplegable propio es un botón, y un
            label envolviéndolo no lo describiría como sí lo hace su aria-label. */}
        <span className="song-admin__filter">
          Estado
          <Select
            options={STATE_OPTIONS.map((state) => ({
              value: state,
              label: STATE_LABELS[state],
            }))}
            value={stateFilter}
            onChange={handleFilterByState}
            size="sm"
            ariaLabel="Filtrar canciones por estado"
          />
        </span>
      </div>

      <SearchBar
        value={search}
        placeholder="Buscar una canción por título..."
        hasActiveSearch={appliedSearch !== ''}
        onChange={setSearch}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {isLoading ? (
        <Loader message="Cargando canciones..." />
      ) : songs.length === 0 ? (
        <p className="song-admin__empty">
          {appliedSearch
            ? `No hay canciones que coincidan con "${appliedSearch}".`
            : 'No hay canciones para mostrar con el estado elegido.'}
        </p>
      ) : (
        <>
          <SongAdminTable
            songs={visibleSongs}
            currentUserId={authState.user?.id ?? 0}
            isAdmin={isAdmin}
            busySongId={busySongId}
            onEdit={handleEdit}
            onDelete={setSongToDelete}
            onApprove={(song) => void handleModerate(song, 'approve')}
            onReject={(song) => void handleModerate(song, 'reject')}
          />

          {hasMore && (
            <div className="song-admin__more">
              <p className="song-admin__more-count">
                Mostrando {visibleSongs.length} de {songs.length} canciones.
              </p>
              <Button
                variant="outline"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                Ver más canciones
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={songToDelete !== null}
        title="Eliminar canción"
        message={songToDelete ? buildDeleteMessage(songToDelete) : ''}
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setSongToDelete(null)}
      />
    </div>
  );
};
