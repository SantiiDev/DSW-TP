// Acciones de la pestaña "Aportes" del perfil (artistas, álbumes y canciones):
// proponer uno nuevo, corregir una propuesta propia y dar de baja una pendiente,
// con sus estados.
//
// Las tres listas de aportes hacían exactamente lo mismo, cada una contra su
// servicio. Acá vive una sola vez; cada lista le pasa su servicio y cómo se llama
// un ítem ("título" o "nombre") para armar los mensajes.
import { useState } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

/** Lo que tiene que saber hacer el servicio de una entidad del catálogo. */
type ContributionService<T, I> = {
  create: (input: I) => Promise<T>;
  update: (id: number, input: I) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
};

type UseContributionsOptions<T, I> = {
  service: ContributionService<T, I>;
  /** Vuelve a pedir la lista de aportes (el reload de useFetch). */
  reload: () => Promise<void>;
  /** Nombre del ítem para los mensajes: el título del álbum, el nombre del artista. */
  getName: (item: T) => string;
};

/**
 * @returns el estado de la lista (qué se edita, qué se borra, qué tarjeta está
 *   ocupada, los avisos) y las acciones para conectar a las tarjetas y a los modales.
 */
export function useContributions<T extends { id: number; isApproved: boolean }, I>({
  service,
  reload,
  getName,
}: UseContributionsOptions<T, I>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error del envío: va adentro del modal, al lado del formulario que lo produjo.
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Aporte que se está editando: si es null, el modal es de propuesta nueva.
  const [editing, setEditing] = useState<T | null>(null);
  // Aporte elegido para eliminar, a la espera de que confirmen el diálogo.
  const [toDelete, setToDelete] = useState<T | null>(null);
  // Aporte con una operación en curso: deshabilita solo sus botones.
  const [busyId, setBusyId] = useState<number | null>(null);
  // Error de una baja: va afuera del modal, arriba de la lista.
  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Abre el modal: vacío para proponer, o con los datos del aporte a corregir.
   * @param item aporte a corregir, o null para proponer uno nuevo.
   */
  const openModal = (item: T | null) => {
    setEditing(item);
    setSubmitError(null);
    setFeedback(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  /**
   * Envía la propuesta nueva o guarda los cambios de una propia.
   * @returns true si salió bien; si falla, el modal queda abierto con el error
   *   para que el usuario corrija (por ejemplo, si ese ítem ya existe).
   */
  const submit = async (input: I): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editing) {
        const updated = await service.update(editing.id, input);
        setFeedback(`Se guardaron los cambios de "${getName(updated)}".`);
      } else {
        const created = await service.create(input);
        // Un ADMIN también propone desde acá, y lo que carga entra ya aprobado: el
        // aviso lo dice según cómo quedó de verdad, no según lo que pasa siempre.
        setFeedback(
          created.isApproved
            ? `"${getName(created)}" se agregó al catálogo.`
            : `Gracias por tu aporte: "${getName(created)}" queda pendiente hasta que un administrador lo apruebe.`
        );
      }
      setIsModalOpen(false);
      await reload();
      return true;
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Da de baja la propuesta ya confirmada en el diálogo. */
  const confirmDelete = async () => {
    if (!toDelete) return;

    const item = toDelete;
    setToDelete(null);
    setBusyId(item.id);
    setFeedback(null);
    setActionError(null);

    try {
      await service.remove(item.id);
      await reload();
      setFeedback(`Se eliminó tu propuesta "${getName(item)}".`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return {
    feedback,
    actionError,
    isModalOpen,
    isSubmitting,
    submitError,
    editing,
    toDelete,
    busyId,
    openModal,
    closeModal,
    submit,
    setToDelete,
    confirmDelete,
  };
}
