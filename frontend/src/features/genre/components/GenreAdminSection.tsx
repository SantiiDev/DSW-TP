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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
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
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Género que se está editando: si es null, el formulario es de alta.
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyGenreId, setBusyGenreId] = useState<number | null>(null);
  // Género elegido para eliminar, a la espera de que confirmen el diálogo.
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);

  // El formulario está arriba de la tabla: al elegir "Editar" en una fila de
  // abajo hay que traer la vista hasta acá, si no parece que el botón no hizo nada.
  const formRef = useRef<HTMLElement>(null);

  const loadGenres = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setGenres(await genreService.list());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGenres();
  }, [loadGenres]);

  /** Carga el género en el formulario y sube la vista hasta él. */
  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreate = async (input: GenreInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const created = await genreService.create(input);
      // Se recarga en vez de agregar a mano: la API devuelve el listado ordenado
      // por nombre y así el género nuevo aparece en su lugar.
      await loadGenres();
      setFeedback(`Se agregó el género "${created.name}".`);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (input: GenreInput): Promise<boolean> => {
    if (!editingGenre) return false;

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      await genreService.update(editingGenre.id, input);
      setEditingGenre(null);
      await loadGenres();
      setFeedback('Los cambios se guardaron.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
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
      {error && (
        <p className="genre-admin__error" role="alert">
          {error}
        </p>
      )}

      {feedback && (
        <p className="genre-admin__feedback" role="status">
          {feedback}
        </p>
      )}

      {/* El formulario es el mismo para alta y edición. La key lo remonta al
          cambiar de género, así arranca con el valor del que se eligió. */}
      <section className="genre-admin__form-block" ref={formRef}>
        <h3 className="genre-admin__form-title">
          {editingGenre ? `Editando "${editingGenre.name}"` : 'Agregar género'}
        </h3>

        {editingGenre ? (
          <GenreForm
            key={editingGenre.id}
            initialValues={{ name: editingGenre.name }}
            isSubmitting={isSubmitting}
            submitLabel="Guardar cambios"
            onSubmit={handleUpdate}
            onCancel={() => setEditingGenre(null)}
          />
        ) : (
          <GenreForm key="new" isSubmitting={isSubmitting} onSubmit={handleCreate} />
        )}
      </section>

      <div className="genre-admin__toolbar">
        <h3 className="genre-admin__list-title">Géneros del catálogo ({genres.length})</h3>
      </div>

      {isLoading ? (
        <Loader message="Cargando géneros..." />
      ) : genres.length === 0 ? (
        <p className="genre-admin__empty">
          Todavía no hay géneros cargados. Agregá el primero con el formulario de arriba.
        </p>
      ) : (
        <GenreAdminTable
          genres={genres}
          busyGenreId={busyGenreId}
          onEdit={handleEdit}
          onDelete={setGenreToDelete}
        />
      )}

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
