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
import { useCallback, useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
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
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error del envío: va adentro del modal, al lado del formulario que lo produjo.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadContributions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setArtists(await artistService.list({ createdBy: userId }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadContributions();
  }, [loadContributions]);

  const handleOpenModal = () => {
    setSubmitError(null);
    setFeedback(null);
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

  /** Elige qué mostrar en el cuerpo: la carga, el error, el vacío o la grilla. */
  const renderBody = () => {
    if (isLoading) return <Loader message="Cargando aportes..." />;

    if (error) {
      return (
        <p className="artist-contributions__error" role="alert">
          {error}
        </p>
      );
    }

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
              <button
                type="button"
                className="artist-contributions__cta"
                onClick={handleOpenModal}
              >
                Proponer un artista
              </button>
            ) : undefined
          }
        />
      );
    }

    return (
      <>
        <div className="artist-contributions__head">
          <h3 className="artist-contributions__title">Artistas ({artists.length})</h3>

          {isOwnProfile && (
            <button type="button" className="artist-contributions__cta" onClick={handleOpenModal}>
              Proponer otro artista
            </button>
          )}
        </div>

        <ul className="artist-contributions__grid">
          {artists.map((artist) => (
            <li key={artist.id}>
              <ArtistCard artist={artist} showState={isOwnProfile} />
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="artist-contributions">
      {feedback && (
        <p className="artist-contributions__feedback" role="status">
          {feedback}
        </p>
      )}

      {renderBody()}

      {isOwnProfile && (
        <ArtistProposalModal
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
