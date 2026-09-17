// Ficha pública de una lista personalizada: su descripción, sus álbumes en
// orden y, si sos su dueño, los controles para editarla, borrarla y sumar o
// sacar álbumes. Es a donde llevan las tarjetas de /lists y el botón "Agregar a
// una lista" de la ficha de un álbum.
//
// La ruta es pública (ver App.tsx), igual que /reviews/:id: una lista se puede
// compartir con cualquiera, tenga o no cuenta. La API también es pública; lo
// único que cambia con sesión es `liked_by_me` y los controles de dueño.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, ListMusic, Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Avatar } from '../../../core/components/Avatar';
import { BackLink } from '../../../core/components/BackLink';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { FormModal } from '../../../core/components/FormModal';
import { Footer } from '../../../core/components/Footer';
import { ConfirmDialog } from '../../../core/components/Modal';
import { IconButton } from '../../../core/components/IconButton';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { GatedLink } from '../../../core/components/GatedLink';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { listService } from '../services/listService';
import type { ListInput } from '../services/listService';
import { ListAlbumPicker } from '../components/ListAlbumPicker';
import { ListForm } from '../components/ListForm';
import { ListMoreFromUser } from '../components/ListMoreFromUser';
import '../styles/_list.scss';

export const ListDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const currentUserId = authState.user?.id ?? null;

  const { data: list, isLoading, error, setData } = useFetch(
    () => listService.getById(Number(id)),
    id
  );

  const [isLiking, setIsLiking] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [busyAlbumId, setBusyAlbumId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Error de lo que pasa DENTRO del modal de agregar álbumes. Va aparte del de
  // la cabecera para que se vea sin cerrar el modal, mismo criterio que el
  // formulario de alta.
  const [pickerError, setPickerError] = useState<string | null>(null);

  const isOwner = list?.canBeEditedBy(currentUserId) ?? false;

  /** Pone o saca el "me gusta". Es un interruptor, igual que en las reseñas. */
  const handleToggleLike = async () => {
    if (!list || isLiking) return;

    setIsLiking(true);
    setActionError(null);

    try {
      setData(await listService.toggleLike(list.id));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsLiking(false);
    }
  };

  const handleUpdate = async (input: ListInput): Promise<boolean> => {
    if (!list) return false;

    setIsSubmitting(true);
    setFormError(null);

    try {
      setData(await listService.update(list.id, input));
      setIsFormOpen(false);
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!list) return;

    setShowDeleteConfirm(false);
    setActionError(null);

    try {
      await listService.remove(list.id);
      navigate('/lists');
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  /**
   * Suma un álbum a la lista. El modal NO se cierra: la idea es poder buscar y
   * agregar varios seguidos, y el que se acaba de agregar desaparece solo de los
   * resultados porque pasa a estar en `excludeIds`.
   */
  const handleAddAlbum = async (albumId: number) => {
    if (!list) return;

    setBusyAlbumId(albumId);
    setPickerError(null);

    try {
      setData(await listService.addAlbum(list.id, albumId));
    } catch (err) {
      setPickerError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  const handleRemoveAlbum = async (albumId: number) => {
    if (!list) return;

    setBusyAlbumId(albumId);
    setActionError(null);

    try {
      setData(await listService.removeAlbum(list.id, albumId));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  return (
    <>
      <Navbar />

      <main className="list-detail">
        {isLoading ? (
          <div className="list-detail__state">
            <Loader message="Cargando la lista..." />
          </div>
        ) : error ? (
          <div className="list-detail__state">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : list ? (
          <>
            <BackLink fallbackTo="/lists" />

            <header className="list-detail__header">
              <p className="list-detail__eyebrow">Lista</p>
              <h1 className="list-detail__title">{list.name}</h1>

              <div className="list-detail__meta">
                <Avatar url={list.user?.urlAvatar ?? null} username={list.authorName} size="sm" />
                <span>
                  por <strong>@{list.authorName}</strong> · {list.dateLabel} · {list.albumsLabel}
                </span>
              </div>

              {list.description && <p className="list-detail__description">{list.description}</p>}

              <div className="list-detail__actions">
                <Button
                  variant={list.likedByMe ? 'success' : 'outline'}
                  disabled={isLiking}
                  onClick={handleToggleLike}
                >
                  <Heart size={16} aria-hidden="true" fill={list.likedByMe ? 'currentColor' : 'none'} />
                  {list.likesLabel}
                </Button>

                {isOwner && (
                  <>
                    <Button
                      variant="subtle"
                      onClick={() => {
                        setFormError(null);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                    </Button>
                    <IconButton
                      icon={<Trash2 size={16} />}
                      label="Eliminar lista"
                      tone="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    />
                  </>
                )}
              </div>

              {actionError && <Alert tone="error">{actionError}</Alert>}
            </header>

            <section className="list-detail__body">
              {isOwner && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setPickerError(null);
                    setIsPickerOpen(true);
                  }}
                >
                  <Plus size={16} aria-hidden="true" />
                  Agregar álbumes
                </Button>
              )}

              {list.albums.length === 0 ? (
                <EmptyState
                  icon={<ListMusic size={22} />}
                  title="Esta lista todavía no tiene álbumes."
                  message={
                    isOwner
                      ? 'Usá el botón de arriba para empezar a sumarlos.'
                      : 'Su dueño todavía no le agregó ninguno.'
                  }
                />
              ) : (
                <ul className="album-collection album-collection--grid">
                  {list.albums.map((album) => (
                    <li key={album.id} className="list-album-item">
                      <GatedLink to={`/albums/${album.id}`} className="album-item">
                        <AlbumCover title={album.title} url={album.urlCover} size="lg" />
                        <div className="album-item__info">
                          <p className="album-item__title">{album.title}</p>
                          <p className="album-item__artist">{album.artistName}</p>
                          {album.releaseYear !== null && (
                            <p className="album-item__year">{album.releaseYear}</p>
                          )}
                        </div>
                      </GatedLink>

                      {isOwner && (
                        <Button
                          variant="subtle"
                          size="sm"
                          fullWidth
                          disabled={busyAlbumId === album.id}
                          onClick={() => handleRemoveAlbum(album.id)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Sacar de la lista
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Salida de la pantalla: qué más armó esta persona. Mismo lugar y
                mismo criterio que "Más de <artista>" en la ficha de un álbum. */}
            {list.user && (
              <ListMoreFromUser
                userId={list.user.id}
                username={list.authorName}
                currentListId={list.id}
              />
            )}

            {/* El buscador va en un modal, igual que en el alta de una lista: se
                abre, se suman los que hagan falta de una sentada y se cierra. El
                modal NO se cierra con cada alta, para poder agregar varios. */}
            <FormModal
              isOpen={isPickerOpen}
              title="Agregar álbumes"
              hint="Buscá por título y sumá los que quieras. Se van agregando a la lista al instante."
              error={pickerError}
              onClose={() => setIsPickerOpen(false)}
            >
              <ListAlbumPicker
                excludeIds={list.albums.map((album) => album.id)}
                isBusy={busyAlbumId !== null}
                // Acá el álbum se suma en la API al instante, así que del objeto
                // que manda el buscador solo hace falta su id.
                onAdd={(album) => void handleAddAlbum(album.id)}
              />
            </FormModal>

            <FormModal
              isOpen={isFormOpen}
              title="Editar lista"
              error={formError}
              isBusy={isSubmitting}
              onClose={() => setIsFormOpen(false)}
            >
              <ListForm
                initialValues={{ name: list.name, description: list.description ?? '' }}
                isSubmitting={isSubmitting}
                submitLabel="Guardar cambios"
                onSubmit={handleUpdate}
                onCancel={() => setIsFormOpen(false)}
              />
            </FormModal>

            <ConfirmDialog
              isOpen={showDeleteConfirm}
              title="Eliminar lista"
              message={`¿Seguro que querés eliminar "${list.name}"? La acción no se puede deshacer.`}
              confirmLabel="Eliminar"
              isDestructive
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteConfirm(false)}
            />
          </>
        ) : (
          <div className="list-detail__state">
            <EmptyState
              icon={<ListMusic size={22} />}
              title="No encontramos esa lista."
              message="Puede que se haya eliminado o que el enlace esté mal."
            />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};
