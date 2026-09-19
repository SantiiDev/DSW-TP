// Ficha pública de una lista personalizada: su descripción, sus álbumes en
// orden y, si sos su dueño, los controles para editarla, borrarla y sumar o
// sacar álbumes. Es a donde llevan las tarjetas de /lists y el botón "Agregar a
// una lista" de la ficha de un álbum.
//
// La ruta es pública (ver App.tsx), igual que /reviews/:id: una lista se puede
// compartir con cualquiera, tenga o no cuenta. La API también es pública; lo
// único que cambia con sesión es `liked_by_me` y los controles de dueño.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, ListMusic, Pencil, Settings2, Trash2 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Avatar } from '../../../core/components/Avatar';
import { BackLink } from '../../../core/components/BackLink';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { FormModal } from '../../../core/components/FormModal';
import { Footer } from '../../../core/components/Footer';
import { ConfirmDialog } from '../../../core/components/Modal';
import { IconButton } from '../../../core/components/IconButton';
import { InlineNotice } from '../../../core/components/InlineNotice';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { GatedLink } from '../../../core/components/GatedLink';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { listService } from '../services/listService';
import type { ListInput } from '../services/listService';
import { ListAlbumManager } from '../components/ListAlbumManager';
import type { ManageNotice } from '../components/ListAlbumManager';
import { ListForm } from '../components/ListForm';
import { ListMoreFromUser } from '../components/ListMoreFromUser';
import type { ListsExploreState } from './ListsExplorePage';
import '../styles/_list.scss';

/** Cuánto queda en pantalla el aviso de "se agregó / se quitó" antes de borrarse solo. */
const NOTICE_MS = 4000;

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
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [busyAlbumId, setBusyAlbumId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // La baja es lo único que se resuelve navegando a otra pantalla, así que sin
  // esta bandera la pantalla se quedaba quieta mientras iba el DELETE y parecía
  // que el botón no había hecho nada.
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Error de lo que pasa DENTRO del modal de administrar álbumes (tanto al
  // agregar como al quitar). Va aparte del de la cabecera para que se vea sin
  // cerrar el modal, mismo criterio que el formulario de alta.
  const [manageError, setManageError] = useState<string | null>(null);
  // Aviso de lo último que se agregó o se quitó. Es un objeto nuevo en cada
  // cambio, y no solo el texto: si fuera texto y se repitiera el mismo mensaje,
  // el efecto de abajo no volvería a correr y el segundo aviso heredaría lo que
  // le quedaba de reloj al primero.
  const [manageNotice, setManageNotice] = useState<ManageNotice | null>(null);

  const isOwner = list?.canBeEditedBy(currentUserId) ?? false;

  // El aviso se borra solo: confirma lo que se acaba de hacer y se va, sin que
  // haya que cerrarlo a mano ni que se acumule con el siguiente cambio.
  useEffect(() => {
    if (!manageNotice) return;

    const timer = setTimeout(() => setManageNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [manageNotice]);

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
    setIsDeleting(true);

    try {
      await listService.remove(list.id);
      // El aviso de que se eliminó se muestra en /lists y no acá, porque esta
      // pantalla deja de existir: viaja el nombre en el state de la navegación.
      navigate('/lists', { state: { deletedListName: list.name } satisfies ListsExploreState });
    } catch (err) {
      setActionError(getErrorMessage(err));
      // Solo hace falta apagarla si falló: si salió bien, la pantalla se va.
      setIsDeleting(false);
    }
  };

  /**
   * Suma un álbum a la lista. El modal NO se cierra: la idea es poder buscar y
   * agregar varios seguidos, y el que se acaba de agregar desaparece solo de los
   * resultados porque pasa a estar en `excludeIds`.
   */
  const handleAddAlbum = async (albumId: number, title: string) => {
    if (!list) return;

    setBusyAlbumId(albumId);
    setManageError(null);

    try {
      setData(await listService.addAlbum(list.id, albumId));
      // El aviso se pone recién acá: si la API falló, lo único que se muestra
      // es el error.
      setManageNotice({ kind: 'added', title });
    } catch (err) {
      setManageError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  /** Saca un álbum de la lista. Igual que el alta, se hace desde el modal y sin cerrarlo. */
  const handleRemoveAlbum = async (albumId: number, title: string) => {
    if (!list) return;

    setBusyAlbumId(albumId);
    setManageError(null);

    try {
      setData(await listService.removeAlbum(list.id, albumId));
      setManageNotice({ kind: 'removed', title });
    } catch (err) {
      setManageError(getErrorMessage(err));
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
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(true)}
                    />
                  </>
                )}
              </div>

              {/* Mientras va el DELETE: el aviso de que se eliminó se muestra
                  recién en /lists, que es a donde lleva la baja. */}
              {isDeleting && <InlineNotice icon={<Trash2 size={14} />}>Eliminando la lista...</InlineNotice>}

              {actionError && <Alert tone="error">{actionError}</Alert>}
            </header>

            <section className="list-detail__body">
              {isOwner && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setManageError(null);
                    setManageNotice(null);
                    setIsManagerOpen(true);
                  }}
                >
                  <Settings2 size={16} aria-hidden="true" />
                  Administrar álbumes
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
                    // La tarjeta es solo el enlace a la ficha del álbum: sacarlo
                    // de la lista se hace desde "Administrar álbumes".
                    <li key={album.id}>
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

            {/* Todo lo que se hace con los álbumes de la lista va en este modal:
                se abre, se agregan y se quitan los que hagan falta de una
                sentada y se cierra. NO se cierra con cada cambio, justamente
                para poder encadenar varios. */}
            <FormModal
              isOpen={isManagerOpen}
              title="Administrar álbumes"
              error={manageError}
              onClose={() => setIsManagerOpen(false)}
            >
              <ListAlbumManager
                albums={list.albums}
                busyAlbumId={busyAlbumId}
                notice={manageNotice}
                onDismissNotice={() => setManageNotice(null)}
                onAdd={(albumId, title) => void handleAddAlbum(albumId, title)}
                onRemove={(albumId, title) => void handleRemoveAlbum(albumId, title)}
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
