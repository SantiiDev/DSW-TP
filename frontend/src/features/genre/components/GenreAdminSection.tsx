// Sección "Géneros" del panel de administración: el ABM completo de los géneros
// del catálogo (alta, edición y baja).
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en GenreForm y
// GenreAdminTable. Vive en la feature genre y no en la feature user para que el
// panel (AdminMusicPanel) solo tenga que montarla.
//
// Es más simple que ArtistAdminSection porque el género no tiene moderación: no
// hay filtro por estado ni botones de aprobar/rechazar. Tampoco tiene buscador ni
// paginado: son once géneros y entran todos en pantalla.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { genreService } from '../services/genreService';
import type { GenreInput } from '../services/genreService';
import type { Genre } from '../models/Genre';
import { GenreForm } from './GenreForm';
import { GenreAdminTable } from './GenreAdminTable';
import '../styles/_genre.scss';

/** Cuántos títulos se nombran en el aviso de que un género no se puede borrar. */
const MAX_LISTED_ALBUMS = 3;

/**
 * Arma el texto del cartel de confirmación de la baja.
 *
 * Si el género tiene álbumes, el diálogo deja de ser una confirmación y pasa a
 * explicar por qué no se puede borrar: la API rechaza la baja con un 409 mientras
 * queden álbumes vinculados, para que borrar un género no se lleve en silencio
 * sus filas de genres_albums.
 *
 * @param genre género que se eligió eliminar.
 */
function buildDeleteMessage(genre: Genre): string {
  if (genre.canBeDeleted) {
    return `¿Seguro que querés eliminar el género "${genre.name}"? No tiene álbumes asignados y la acción no se puede deshacer.`;
  }

  const listed = genre.albums.slice(0, MAX_LISTED_ALBUMS).map((album) => album.title);
  const rest = genre.albumsCount - listed.length;
  const examples = rest > 0 ? `${listed.join(', ')} y ${rest} más` : listed.join(', ');

  return `El género "${genre.name}" no se puede eliminar todavía: tiene ${genre.albumsLabel} asignados (${examples}). Hay que desvincular esos álbumes antes de borrarlo.`;
}

export const GenreAdminSection = () => {
  const {
    data,
    isLoading,
    error,
    reload: loadGenres,
    setError,
  } = useFetch(() => genreService.list());
  const genres = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Género que se está editando: si es null, el formulario es de alta.
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyGenreId, setBusyGenreId] = useState<number | null>(null);
  // Género elegido para eliminar, a la espera de que confirmen el diálogo.
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);

  // El formulario vive en un modal: al panel se entra a mirar y a moderar mucho
  // más seguido que a cargar, así que el alta espera detrás de un botón en vez
  // de ocupar el lugar de arriba de la tabla.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Error del alta o de la edición. Va aparte del error de la sección porque se
  // muestra DENTRO del modal: si se mostrara afuera, quedaría tapado por el
  // propio formulario.
  const [formError, setFormError] = useState<string | null>(null);

  /** Abre el modal vacío, para cargar un género nuevo. */
  const handleOpenCreate = () => {
    setEditingGenre(null);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  /** Abre el modal con los datos del género elegido. */
  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleCreate = async (input: GenreInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      const created = await genreService.create(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por nombre y así el género nuevo aparece en su lugar.
      await loadGenres();
      setIsFormOpen(false);
      setFeedback(`Se agregó el género "${created.name}".`);
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

  const handleUpdate = async (input: GenreInput): Promise<boolean> => {
    if (!editingGenre) return false;

    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      await genreService.update(editingGenre.id, input);
      setEditingGenre(null);
      await loadGenres();
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

  const handleConfirmDelete = async () => {
    if (!genreToDelete) return;

    const { id, name } = genreToDelete;
    setGenreToDelete(null);
    setBusyGenreId(id);
    setError(null);
    setFeedback(null);

    try {
      await genreService.remove(id);
      // Si se estaba editando justo ese género, el formulario ya no aplica.
      setEditingGenre((current) => (current?.id === id ? null : current));
      await loadGenres();
      setFeedback(`Se eliminó el género "${name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyGenreId(null);
    }
  };

  const blocksDelete = genreToDelete !== null && !genreToDelete.canBeDeleted;

  return (
    <div className="genre-admin">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      <div className="genre-admin__toolbar">
        <h3 className="genre-admin__list-title">Géneros del catálogo ({genres.length})</h3>

        <Button onClick={handleOpenCreate}>
          <Plus size={16} aria-hidden="true" />
          Agregar género
        </Button>
      </div>

      {isLoading ? (
        <Loader message="Cargando géneros..." />
      ) : genres.length === 0 ? (
        <p className="genre-admin__empty">
          Todavía no hay géneros cargados. Agregá el primero con el botón de arriba.
        </p>
      ) : (
        <GenreAdminTable
          genres={genres}
          busyGenreId={busyGenreId}
          onEdit={handleEdit}
          onDelete={setGenreToDelete}
        />
      )}

      {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
          el título, los valores iniciales y a qué handler se manda. La key lo
          remonta al pasar de uno a otro, así arranca con el valor correcto. */}
      <FormModal
        isOpen={isFormOpen}
        title={editingGenre ? `Editando "${editingGenre.name}"` : 'Agregar género'}
        error={formError}
        isBusy={isSubmitting}
        onClose={() => setIsFormOpen(false)}
      >
        <GenreForm
          key={editingGenre?.id ?? 'new'}
          initialValues={editingGenre ? { name: editingGenre.name } : undefined}
          isSubmitting={isSubmitting}
          submitLabel={editingGenre ? 'Guardar cambios' : undefined}
          onSubmit={editingGenre ? handleUpdate : handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormModal>

      {/* Con álbumes asignados el diálogo solo informa: confirmar no borraría
          nada, porque la API rechaza la baja mientras esos álbumes existan. */}
      <ConfirmDialog
        isOpen={genreToDelete !== null}
        title={blocksDelete ? 'No se puede eliminar el género' : 'Eliminar género'}
        message={genreToDelete ? buildDeleteMessage(genreToDelete) : ''}
        confirmLabel={blocksDelete ? 'Entendido' : 'Eliminar'}
        cancelLabel={blocksDelete ? 'Cerrar' : 'Cancelar'}
        isDestructive={!blocksDelete}
        onConfirm={blocksDelete ? () => setGenreToDelete(null) : handleConfirmDelete}
        onCancel={() => setGenreToDelete(null)}
      />
    </div>
  );
};
