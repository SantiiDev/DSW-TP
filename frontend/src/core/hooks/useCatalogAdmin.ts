// Acciones de las secciones de catálogo del panel de administración (artistas,
// álbumes y canciones): alta, edición, moderación y baja, con sus estados.
//
// Las tres secciones hacían exactamente lo mismo, cada una contra su servicio:
// abrir el formulario, guardar, aprobar o rechazar un aporte, confirmar y borrar,
// y avisar cómo salió. Acá vive una sola vez; cada sección le pasa su servicio y
// cómo se llama un ítem ("título" o "nombre") para armar los mensajes.
import { useState } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

/** Lo que tiene que saber hacer el servicio de una entidad del catálogo. */
type CatalogService<T, I> = {
  create: (input: I) => Promise<T>;
  update: (id: number, input: I) => Promise<unknown>;
  approve: (id: number) => Promise<unknown>;
  reject: (id: number) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
};

type UseCatalogAdminOptions<T, I> = {
  service: CatalogService<T, I>;
  /** Vuelve a pedir el listado (el reload de useFetch). */
  reload: () => Promise<void>;
  /** Pone o borra el error de la sección (el setError de useFetch). */
  setError: (message: string | null) => void;
  /** Nombre del ítem para los mensajes: el título del álbum, el nombre del artista. */
  getName: (item: T) => string;
};

/**
 * @returns el estado de la sección (qué se edita, qué se borra, qué fila está
 *   ocupada, los avisos) y las acciones para conectar a la tabla y a los modales.
 */
export function useCatalogAdmin<T extends { id: number }, I>({
  service,
  reload,
  setError,
  getName,
}: UseCatalogAdminOptions<T, I>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error del alta o de la edición: se muestra DENTRO del modal, porque afuera
  // quedaría tapado por el propio formulario.
  const [formError, setFormError] = useState<string | null>(null);
  // Ítem que se está editando: si es null, el formulario es de alta.
  const [editing, setEditing] = useState<T | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyId, setBusyId] = useState<number | null>(null);
  // Ítem elegido para eliminar, a la espera de que confirmen el diálogo.
  const [toDelete, setToDelete] = useState<T | null>(null);

  /**
   * Abre el modal del formulario.
   * @param item ítem a editar, o null para cargar uno nuevo.
   */
  const openForm = (item: T | null) => {
    setEditing(item);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  /**
   * Guarda el formulario: edita si hay un ítem elegido, si no da de alta uno nuevo.
   * @returns true si salió bien; si falla, el modal queda abierto con lo que se
   *   había escrito, para no tener que cargar todo de nuevo por un nombre repetido.
   */
  const submit = async (input: I): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      if (editing) {
        await service.update(editing.id, input);
        setFeedback('Los cambios se guardaron.');
      } else {
        const created = await service.create(input);
        setFeedback(`Se agregó "${getName(created)}" al catálogo.`);
      }
      // Se recarga en vez de tocar la lista a mano: la API la devuelve ordenada y
      // así el ítem aparece en su lugar.
      await reload();
      setIsFormOpen(false);
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
   * @param decision qué se decidió sobre el aporte.
   */
  const moderate = async (item: T, decision: 'approve' | 'reject') => {
    setBusyId(item.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await service.approve(item.id);
      else await service.reject(item.id);

      await reload();
      const label = decision === 'approve' ? 'aprobó' : 'rechazó';
      setFeedback(`Se ${label} el aporte "${getName(item)}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  /** Borra el ítem ya confirmado en el diálogo. */
  const confirmDelete = async () => {
    if (!toDelete) return;

    const item = toDelete;
    setToDelete(null);
    setBusyId(item.id);
    setError(null);
    setFeedback(null);

    try {
      await service.remove(item.id);
      // Si se estaba editando justo ese ítem, el formulario ya no aplica.
      setEditing((current) => (current?.id === item.id ? null : current));
      await reload();
      setFeedback(`Se eliminó "${getName(item)}" del catálogo.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return {
    feedback,
    isFormOpen,
    isSubmitting,
    formError,
    editing,
    busyId,
    toDelete,
    openForm,
    closeForm,
    submit,
    moderate,
    setToDelete,
    confirmDelete,
  };
}
