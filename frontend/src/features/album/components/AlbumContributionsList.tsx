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
import { ConfirmDialog } from '../../../core/components/Modal';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { albumService } from '../services/albumService';
import type { AlbumInput } from '../services/albumService';
import type { Album } from '../models/Album';
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

// Cuántos aportes se ven de entrada y cuántos suma cada "Ver más". Mismo
// criterio que ArtistContributionsList, su hermana.
const PAGE_SIZE = 12;

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
  // Aporte que se está editando: si es null, el modal es de propuesta nueva.
  const [editing, setEditing] = useState<Album | null>(null);
  // Aporte elegido para eliminar, a la espera de que confirmen el diálogo.
  const [toDelete, setToDelete] = useState<Album | null>(null);
  // Aporte con una operación en curso: deshabilita solo sus botones.
  const [busyAlbumId, setBusyAlbumId] = useState<number | null>(null);
  // Error de una baja: va afuera del modal, arriba de la lista.
  const [actionError, setActionError] = useState<string | null>(null);
  // Cuántos aportes se muestran (paginado del lado del cliente). No hace falta
  // resetearlo: ProfileTabContent remonta este componente al cambiar de pestaña
  // (Artistas/Álbumes/Canciones son tres componentes distintos), así que arranca
  // de nuevo solo.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /**
   * Abre el modal: vacío para proponer, o con los datos del aporte a corregir.
   * @param album aporte a corregir, o null para proponer uno nuevo.
   */
  const handleOpenModal = (album: Album | null) => {
    setEditing(album);
    setSubmitError(null);
    setFeedback(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  /**
   * Envía la propuesta nueva o guarda los cambios de una propia.
   * @param input datos cargados en el modal.
   * @returns true si salió bien; si falla, el modal queda abierto con el error
   *   para que el usuario corrija (por ejemplo, si ese álbum ya existe).
   */
  const handleSubmit = async (input: AlbumInput): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editing) {
        const updated = await albumService.update(editing.id, input);
        setFeedback(`Se guardaron los cambios de "${updated.title}".`);
      } else {
        const created = await albumService.create(input);
        // Un ADMIN también propone desde acá, y lo que carga entra ya aprobado: el
        // aviso lo dice según cómo quedó de verdad, no según lo que pasa siempre.
        setFeedback(
          created.isApproved
            ? `"${created.title}" se agregó al catálogo.`
            : `Gracias por tu aporte: "${created.title}" queda pendiente hasta que un administrador lo apruebe.`
        );
      }
      setIsModalOpen(false);
      await loadContributions();
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
    setBusyAlbumId(id);
    setFeedback(null);
    setActionError(null);

    try {
      await albumService.remove(id);
      await loadContributions();
      setFeedback(`Se eliminó tu propuesta "${title}".`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
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
            isOwnProfile ? <Button onClick={() => handleOpenModal(null)}>Proponer un álbum</Button> : undefined
          }
        />
      );
    }

    const visibleAlbums = albums.slice(0, visibleCount);
    const hasMore = albums.length > visibleCount;

    return (
      <>
        <div className="album-contributions__head">
          <h3 className="album-contributions__title">Álbumes ({albums.length})</h3>

          {isOwnProfile && <Button onClick={() => handleOpenModal(null)}>Proponer otro álbum</Button>}
        </div>

        {/* Sobre sus propios aportes el autor puede: corregir mientras no estén
            aprobados (un aprobado ya es catálogo y lo edita un ADMIN), y dar de
            baja solo los que siguen pendientes, que es lo que la API permite.
            Un rechazo es una decisión de moderación y no se borra solo. */}
        <ul className="album-contributions__grid">
          {visibleAlbums.map((album) => (
            <li key={album.id}>
              <AlbumCard
                album={album}
                showState={isOwnProfile}
                isBusy={busyAlbumId === album.id}
                onEdit={isOwnProfile && !album.isApproved ? handleOpenModal : undefined}
                onDelete={isOwnProfile && album.isPending ? setToDelete : undefined}
              />
            </li>
          ))}
        </ul>

        {hasMore && (
          <div className="album-contributions__more">
            <p className="album-contributions__more-count">
              Mostrando {visibleAlbums.length} de {albums.length} álbumes.
            </p>
            <Button variant="outline" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
              Ver más álbumes
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="album-contributions">
      {feedback && <Alert tone="success">{feedback}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      {renderBody()}

      {isOwnProfile && (
        <>
          {/* El mismo modal sirve para proponer y para corregir: lo que cambia
              son los textos, los valores iniciales y a qué handler se manda. */}
          <AlbumProposalModal
            isOpen={isModalOpen}
            album={editing}
            isSubmitting={isSubmitting}
            error={submitError}
            onSubmit={handleSubmit}
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
