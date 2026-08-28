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
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { songService } from '../services/songService';
import type { SongInput } from '../services/songService';
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

  const handleOpenModal = () => {
    setSubmitError(null);
    setFeedback(null);
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

        <ul className="song-contributions__list">
          {songs.map((song) => (
            <li key={song.id}>
              <SongCard song={song} showState={isOwnProfile} />
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="song-contributions">
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {renderBody()}

      {isOwnProfile && (
        <SongProposalModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={handlePropose}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
