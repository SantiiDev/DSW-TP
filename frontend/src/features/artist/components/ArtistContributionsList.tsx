// Artistas que aportó un usuario, en la pestaña "Aportes" de su perfil.
//
// Es también el único lugar donde un usuario propone un artista nuevo: el botón
// abre un modal con el formulario y manda la propuesta sin salir del perfil.
//
// En el perfil propio se ven también los pendientes y los rechazados (por eso
// cada card muestra su estado): el que los cargó necesita saber en qué quedaron.
// En el perfil de otro usuario la API devuelve solo lo aprobado.
//
// Vive en la feature artist para que el perfil solo tenga que montarla. Cuando
// existan los CRUD de álbum y canción, la pestaña va a sumar sus propias
// secciones al lado de esta.
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { artistService } from '../services/artistService';
import type { ArtistInput } from '../services/artistService';
import type { Artist } from '../models/Artist';
import { ArtistCard } from './ArtistCard';
import { ArtistProposalModal } from './ArtistProposalModal';
import '../styles/_artist.scss';

type ArtistContributionsListProps = {
  /** Dueño del perfil que se está mirando. */
  userId: number;
  username: string;
  /** true si el perfil es del usuario logueado: solo él puede proponer acá. */
  isOwnProfile: boolean;
};

export const ArtistContributionsList = ({
  userId,
  username,
  isOwnProfile,
}: ArtistContributionsListProps) => {
  const {
    data,
    isLoading,
    error,
    reload: loadContributions,
  } = useFetch(() => artistService.list({ createdBy: userId }), userId);
  const artists = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error del envío: va adentro del modal, al lado del formulario que lo produjo.
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Aporte que se está editando: si es null, el modal es de propuesta nueva.
  const [editing, setEditing] = useState<Artist | null>(null);
  // Aporte elegido para eliminar, a la espera de que confirmen el diálogo.
  const [toDelete, setToDelete] = useState<Artist | null>(null);
  // Aporte con una operación en curso: deshabilita solo sus botones.
  const [busyArtistId, setBusyArtistId] = useState<number | null>(null);
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
  const handleEdit = (artist: Artist) => {
    setEditing(artist);
    setSubmitError(null);
    setFeedback(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  /**
   * Envía la propuesta.
   * @param input nombre y biografía cargados en el modal.
   * @returns true si se creó; si falla, el modal queda abierto con el error para
   *   que el usuario corrija (por ejemplo, si ese artista ya existe).
   */
  const handlePropose = async (input: ArtistInput): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await artistService.create(input);
      setIsModalOpen(false);
      await loadContributions();
      setFeedback(
        `Gracias por tu aporte: "${created.name}" queda pendiente hasta que un administrador lo apruebe.`
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
   * @param input nombre y biografía corregidos en el modal.
   * @returns true si se guardó; si falla, el modal queda abierto con el error.
   */
  const handleUpdate = async (input: ArtistInput): Promise<boolean> => {
    if (!editing) return false;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const updated = await artistService.update(editing.id, input);
      setIsModalOpen(false);
      setEditing(null);
      await loadContributions();
      setFeedback(`Se guardaron los cambios de "${updated.name}".`);
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

    const { id, name } = toDelete;
    setToDelete(null);
    setBusyArtistId(id);
    setFeedback(null);
    setActionError(null);

    try {
      await artistService.remove(id);
      await loadContributions();
      setFeedback(`Se eliminó tu propuesta "${name}".`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyArtistId(null);
    }
  };

  /** Elige qué mostrar en el cuerpo: la carga, el error, el vacío o la grilla. */
  const renderBody = () => {
    if (isLoading) return <Loader message="Cargando aportes..." />;

    if (error) return <Alert tone="error">{error}</Alert>;

    if (artists.length === 0) {
      return (
        <EmptyState
          icon={<PlusCircle size={22} />}
          title={
            isOwnProfile
              ? 'Todavía no propusiste ningún artista.'
              : `${username} no tiene artistas aportados.`
          }
          message={
            isOwnProfile
              ? 'Si falta alguien en Musicboxd, proponelo: tu aporte queda pendiente hasta que un administrador lo apruebe.'
              : 'Los artistas que aporte van a listarse acá una vez aprobados.'
          }
          action={
            isOwnProfile ? (
              <Button onClick={handleOpenModal}>Proponer un artista</Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <>
        <div className="artist-contributions__head">
          <h3 className="artist-contributions__title">Artistas ({artists.length})</h3>

          {isOwnProfile && <Button onClick={handleOpenModal}>Proponer otro artista</Button>}
        </div>

        {/* Sobre sus propios aportes el autor puede: corregir mientras no estén
            aprobados (un aprobado ya es catálogo y lo edita un ADMIN), y dar de
            baja solo los que siguen pendientes, que es lo que la API permite.
            Un rechazo es una decisión de moderación y no se borra solo. */}
        <ul className="artist-contributions__grid">
          {artists.map((artist) => (
            <li key={artist.id}>
              <ArtistCard
                artist={artist}
                showState={isOwnProfile}
                isBusy={busyArtistId === artist.id}
                onEdit={isOwnProfile && !artist.isApproved ? handleEdit : undefined}
                onDelete={isOwnProfile && artist.isPending ? setToDelete : undefined}
              />
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="artist-contributions">
      {feedback && <Alert tone="success">{feedback}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      {renderBody()}

      {isOwnProfile && (
        <>
          {/* El mismo modal sirve para proponer y para corregir: lo que cambia
              son los textos, los valores iniciales y a qué handler se manda. */}
          <ArtistProposalModal
            isOpen={isModalOpen}
            artist={editing}
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
                ? `¿Seguro que querés eliminar tu propuesta "${toDelete.name}"? Todavía no la revisó nadie, así que se borra sin dejar rastro.`
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
