// Canciones que aportó un usuario, en la pestaña "Aportes" de su perfil.
//
// Es también uno de los lugares donde un usuario propone una canción nueva: el
// botón abre un modal con el formulario y manda la propuesta sin salir del perfil.
//
// En el perfil propio se ven también las pendientes y las rechazadas (por eso
// cada card muestra su estado): el que las cargó necesita saber en qué quedaron.
// En el perfil de otro usuario la API devuelve solo lo aprobado.
//
// OJO, no confundir con la pestaña "Canciones calificadas": esa lista las que el
// usuario reseñó, y depende de la feature review. Esta lista las que cargó.
import { useState } from 'react';
import { Music } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { songService } from '../services/songService';
import type { SongInput } from '../services/songService';
import type { Song } from '../models/Song';
import { SongCard } from './SongCard';
import { SongProposalModal } from './SongProposalModal';
import '../styles/_song.scss';

type SongContributionsListProps = {
  /** Dueño del perfil que se está mirando. */
  userId: number;
  username: string;
  /** true si el perfil es del usuario logueado: solo él puede proponer acá. */
  isOwnProfile: boolean;
};

export const SongContributionsList = ({
  userId,
  username,
  isOwnProfile,
}: SongContributionsListProps) => {
  const {
    data,
    isLoading,
    error,
    reload: loadContributions,
  } = useFetch(() => songService.list({ createdBy: userId }), userId);
  const songs = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error del envío: va adentro del modal, al lado del formulario que lo produjo.
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Aporte que se está editando: si es null, el modal es de propuesta nueva.
  const [editing, setEditing] = useState<Song | null>(null);
  // Aporte elegido para eliminar, a la espera de que confirmen el diálogo.
  const [toDelete, setToDelete] = useState<Song | null>(null);
  // Aporte con una operación en curso: deshabilita solo sus botones.
  const [busySongId, setBusySongId] = useState<number | null>(null);
  // Error de una baja: va afuera del modal, arriba de la lista.
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setEditing(null);
    setSubmitError(null);
    setFeedback(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  /** Abre el mismo modal, pero con los datos del aporte que se quiere corregir. */
  const handleEdit = (song: Song) => {
    setEditing(song);
    setSubmitError(null);
    setFeedback(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  /**
   * Envía la propuesta.
   * @param input datos cargados en el modal.
   * @returns true si se creó; si falla, el modal queda abierto con el error para
   *   que el usuario corrija (por ejemplo, si esa pista ya está ocupada).
   */
  const handlePropose = async (input: SongInput): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await songService.create(input);
      setIsModalOpen(false);
      await loadContributions();
      // Un ADMIN también propone desde acá, y lo que carga entra ya aprobado: el
      // aviso lo dice según cómo quedó de verdad, no según lo que pasa siempre.
      setFeedback(
        created.isApproved
          ? `"${created.title}" se agregó al catálogo.`
          : `Gracias por tu aporte: "${created.title}" queda pendiente hasta que un administrador lo apruebe.`
      );
      return true;
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Guarda los cambios de una propuesta propia.
   * @param input datos corregidos en el modal.
   * @returns true si se guardó; si falla, el modal queda abierto con el error.
   */
  const handleUpdate = async (input: SongInput): Promise<boolean> => {
    if (!editing) return false;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const updated = await songService.update(editing.id, input);
      setIsModalOpen(false);
      setEditing(null);
      await loadContributions();
      setFeedback(`Se guardaron los cambios de "${updated.title}".`);
      return true;
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Da de baja la propuesta ya confirmada en el diálogo. */
  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    const { id, title } = toDelete;
    setToDelete(null);
    setBusySongId(id);
    setFeedback(null);
    setActionError(null);

    try {
      await songService.remove(id);
      await loadContributions();
      setFeedback(`Se eliminó tu propuesta "${title}".`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusySongId(null);
    }
  };

  /** Elige qué mostrar en el cuerpo: la carga, el error, el vacío o la lista. */
  const renderBody = () => {
    if (isLoading) return <Loader message="Cargando canciones aportadas..." />;

    if (error) return <Alert tone="error">{error}</Alert>;

    if (songs.length === 0) {
      return (
        <EmptyState
          icon={<Music size={22} />}
          title={
            isOwnProfile
              ? 'Todavía no propusiste ninguna canción.'
              : `${username} no tiene canciones aportadas.`
          }
          message={
            isOwnProfile
              ? 'Si falta una pista en el tracklist de un álbum, proponela: tu aporte queda pendiente hasta que un administrador lo apruebe.'
              : 'Las canciones que aporte van a listarse acá una vez aprobadas.'
          }
          action={
            isOwnProfile ? (
              <Button onClick={handleOpenModal}>Proponer una canción</Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <>
        <div className="song-contributions__head">
          <h3 className="song-contributions__title">Canciones ({songs.length})</h3>

          {isOwnProfile && <Button onClick={handleOpenModal}>Proponer otra canción</Button>}
        </div>

        {/* Sobre sus propios aportes el autor puede: corregir mientras no estén
            aprobados (un aprobado ya es catálogo y lo edita un ADMIN), y dar de
            baja solo los que siguen pendientes, que es lo que la API permite.
            Un rechazo es una decisión de moderación y no se borra solo. */}
        <ul className="song-contributions__list">
          {songs.map((song) => (
            <li key={song.id}>
              <SongCard
                song={song}
                showState={isOwnProfile}
                isBusy={busySongId === song.id}
                onEdit={isOwnProfile && !song.isApproved ? handleEdit : undefined}
                onDelete={isOwnProfile && song.isPending ? setToDelete : undefined}
              />
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="song-contributions">
      {feedback && <Alert tone="success">{feedback}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      {renderBody()}

      {isOwnProfile && (
        <>
          {/* El mismo modal sirve para proponer y para corregir: lo que cambia
              son los textos, los valores iniciales y a qué handler se manda. */}
          <SongProposalModal
            isOpen={isModalOpen}
            song={editing}
            isSubmitting={isSubmitting}
            error={submitError}
            onSubmit={editing ? handleUpdate : handlePropose}
            onClose={() => setIsModalOpen(false)}
          />

          <ConfirmDialog
            isOpen={toDelete !== null}
            title="Eliminar la propuesta"
            message={
              toDelete
                ? `¿Seguro que querés eliminar tu propuesta "${toDelete.title}"? Todavía no la revisó nadie, así que se borra sin dejar rastro.`
                : ''
            }
            confirmLabel="Eliminar"
            isDestructive
            onConfirm={handleConfirmDelete}
            onCancel={() => setToDelete(null)}
          />
        </>
      )}
    </div>
  );
};
