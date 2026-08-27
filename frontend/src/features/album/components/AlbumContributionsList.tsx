// Álbumes que aportó un usuario, en la pestaña "Aportes" de su perfil.
//
// Es también uno de los lugares donde un usuario propone un álbum nuevo: el botón
// abre un modal con el formulario y manda la propuesta sin salir del perfil.
//
// En el perfil propio se ven también los pendientes y los rechazados (por eso
// cada card muestra su estado): el que los cargó necesita saber en qué quedaron.
// En el perfil de otro usuario la API devuelve solo lo aprobado.
//
// Vive en la feature album para que el perfil solo tenga que montarla, igual que
// ArtistContributionsList en la feature artist.
import { useState } from 'react';
import { Disc3 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { albumService } from '../services/albumService';
import type { AlbumInput } from '../services/albumService';
import { AlbumCard } from './AlbumCard';
import { AlbumProposalModal } from './AlbumProposalModal';
import '../styles/_album.scss';

type AlbumContributionsListProps = {
  /** Dueño del perfil que se está mirando. */
  userId: number;
  username: string;
  /** true si el perfil es del usuario logueado: solo él puede proponer acá. */
  isOwnProfile: boolean;
};

export const AlbumContributionsList = ({
  userId,
  username,
  isOwnProfile,
}: AlbumContributionsListProps) => {
  const {
    data,
    isLoading,
    error,
    reload: loadContributions,
  } = useFetch(() => albumService.list({ createdBy: userId }), userId);
  const albums = data ?? [];

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
   *   que el usuario corrija (por ejemplo, si ese álbum ya existe).
   */
  const handlePropose = async (input: AlbumInput): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await albumService.create(input);
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

  /** Elige qué mostrar en el cuerpo: la carga, el error, el vacío o la grilla. */
  const renderBody = () => {
    if (isLoading) return <Loader message="Cargando álbumes aportados..." />;

    if (error) return <Alert tone="error">{error}</Alert>;

    if (albums.length === 0) {
      return (
        <EmptyState
          icon={<Disc3 size={22} />}
          title={
            isOwnProfile
              ? 'Todavía no propusiste ningún álbum.'
              : `${username} no tiene álbumes aportados.`
          }
          message={
            isOwnProfile
              ? 'Si falta un disco en Musicboxd, proponelo: tu aporte queda pendiente hasta que un administrador lo apruebe.'
              : 'Los álbumes que aporte van a listarse acá una vez aprobados.'
          }
          action={
            isOwnProfile ? <Button onClick={handleOpenModal}>Proponer un álbum</Button> : undefined
          }
        />
      );
    }

    return (
      <>
        <div className="album-contributions__head">
          <h3 className="album-contributions__title">Álbumes ({albums.length})</h3>

          {isOwnProfile && <Button onClick={handleOpenModal}>Proponer otro álbum</Button>}
        </div>

        <ul className="album-contributions__grid">
          {albums.map((album) => (
            <li key={album.id}>
              <AlbumCard album={album} showState={isOwnProfile} />
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="album-contributions">
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {renderBody()}

      {isOwnProfile && (
        <AlbumProposalModal
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
