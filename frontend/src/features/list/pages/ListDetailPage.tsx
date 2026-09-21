// Ficha pública de una lista personalizada: su descripción, sus ítems en orden
// y, si sos su dueño, los controles para editarla, borrarla y sumar o sacar
// ítems. Es a donde llevan las tarjetas de /lists y el botón "Agregar a una
// lista" de la ficha de un álbum o de una canción.
//
// Una lista es de álbumes O de canciones (su columna `type`), así que esta
// pantalla es la misma para las dos y lo único que cambia son los textos y a
// dónde enlaza cada tarjeta.
//
// La ruta es pública (ver App.tsx), igual que /reviews/:id: una lista se puede
// compartir con cualquiera, tenga o no cuenta. La API también es pública; lo
// único que cambia con sesión es `liked_by_me` y los controles de dueño.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, ListMusic, Lock, Pencil, Settings2, Share2, Trash2 } from 'lucide-react';
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
import { useCopyLink } from '../../../core/hooks/useCopyLink';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { GatedLink } from '../../../core/components/GatedLink';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { listService } from '../services/listService';
import type { ListInput } from '../services/listService';
import { ListItemManager } from '../components/ListItemManager';
import type { ManageNotice } from '../components/ListItemManager';
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
  // Editar, borrar y administrar los ítems son escrituras, y escribir listas es
  // un beneficio Pro: no alcanza con ser el dueño.
  const isPro = authState.user?.isPro ?? false;

  const { data: list, isLoading, error, setData } = useFetch(
    () => listService.getById(Number(id)),
    id
  );

  // Copia el enlace de la lista al portapapeles. La ficha es pública, así que
  // quien lo reciba la puede abrir aunque no tenga cuenta.
  const { copied, copy } = useCopyLink();

  const [isLiking, setIsLiking] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // La baja es lo único que se resuelve navegando a otra pantalla, así que sin
  // esta bandera la pantalla se quedaba quieta mientras iba el DELETE y parecía
  // que el botón no había hecho nada.
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Error de lo que pasa DENTRO del modal de administrar ítems (tanto al
  // agregar como al quitar). Va aparte del de la cabecera para que se vea sin
  // cerrar el modal, mismo criterio que el formulario de alta.
  const [manageError, setManageError] = useState<string | null>(null);
  // Aviso de lo último que se agregó o se quitó. Es un objeto nuevo en cada
  // cambio, y no solo el texto: si fuera texto y se repitiera el mismo mensaje,
  // el efecto de abajo no volvería a correr y el segundo aviso heredaría lo que
  // le quedaba de reloj al primero.
  const [manageNotice, setManageNotice] = useState<ManageNotice | null>(null);

  const isOwner = list?.canBeEditedBy(currentUserId) ?? false;
  // Ser el dueño alcanza para ver de quién es la lista, pero no para tocarla: el
  // backend exige además membresía Pro vigente (ver assertCanWrite en
  // list.service.ts). Sin esto, a alguien que dejó de ser Pro le quedaban a la
  // vista los botones de editar, borrar y administrar, y los tres respondían 403.
  const canManage = isOwner && isPro;

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
   * Suma o saca un ítem de la lista. El modal NO se cierra: la idea es poder
   * encadenar varios cambios seguidos, y el que se acaba de agregar desaparece
   * solo de los resultados porque pasa a estar en `excludeIds`.
   *
   * Si el ítem es un álbum o una canción no se decide acá: lo sabe la lista por
   * su tipo, y la API resuelve contra la tabla que corresponda.
   *
   * @param kind 'added' para sumarlo, 'removed' para sacarlo.
   */
  const handleChangeItem = async (itemId: number, title: string, kind: ManageNotice['kind']) => {
    if (!list) return;

    setBusyItemId(itemId);
    setManageError(null);

    try {
      const updated =
        kind === 'added'
          ? await listService.addItem(list.id, itemId)
          : await listService.removeItem(list.id, itemId);
      setData(updated);
      // El aviso se pone recién acá: si la API falló, lo único que se muestra
      // es el error.
      setManageNotice({ kind, title });
    } catch (err) {
      setManageError(getErrorMessage(err));
    } finally {
      setBusyItemId(null);
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
              {/* El encabezado dice de qué es la lista: es lo primero que hay
                  que saber para entender qué se está mirando. */}
              <p className="list-detail__eyebrow">
                {list.isSongList ? 'Lista de canciones' : 'Lista de álbumes'}
              </p>
              <h1 className="list-detail__title">{list.name}</h1>

              <div className="list-detail__meta">
                <Avatar url={list.user?.urlAvatar ?? null} username={list.authorName} size="sm" />
                <span>
                  por <strong>@{list.authorName}</strong> · {list.dateLabel} · {list.itemsLabel}
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

                {/* Al lado del corazón porque son las dos acciones que puede
                    hacer cualquiera que entre, sea o no el dueño. Compartir no
                    pide sesión: la ficha es pública y es justamente el enlace
                    que se comparte. */}
                <Button variant="outline" onClick={() => void copy(list.sharePath)}>
                  {copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Share2 size={16} aria-hidden="true" />
                  )}
                  {copied ? '¡Enlace copiado!' : 'Compartir'}
                </Button>

                {canManage && (
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

              {/* Al dueño que ya no es Pro se le explica por qué no están los
                  controles, en vez de dejarlo sin ellos y sin motivo. La lista
                  sigue publicada y visible para todos. */}
              {isOwner && !isPro && (
                <InlineNotice icon={<Lock size={14} />}>
                  Tu lista sigue publicada, pero para editarla necesitás la membresía{' '}
                  <Link to="/pro" className="list-detail__pro-link">
                    Pro
                  </Link>
                  .
                </InlineNotice>
              )}

              {/* Mientras va el DELETE: el aviso de que se eliminó se muestra
                  recién en /lists, que es a donde lleva la baja. */}
              {isDeleting && <InlineNotice icon={<Trash2 size={14} />}>Eliminando la lista...</InlineNotice>}

              {actionError && <Alert tone="error">{actionError}</Alert>}
            </header>

            <section className="list-detail__body">
              {canManage && (
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
                  {list.isSongList ? 'Administrar canciones' : 'Administrar álbumes'}
                </Button>
              )}

              {list.items.length === 0 ? (
                <EmptyState
                  icon={<ListMusic size={22} />}
                  title={
                    list.isSongList
                      ? 'Esta lista todavía no tiene canciones.'
                      : 'Esta lista todavía no tiene álbumes.'
                  }
                  message={
                    canManage
                      ? 'Usá el botón de arriba para empezar a sumarlas.'
                      : 'Su dueño todavía no le agregó ninguna.'
                  }
                />
              ) : (
                <ul className="album-collection album-collection--grid">
                  {list.items.map((item) => (
                    // La tarjeta es solo el enlace a la ficha del ítem —del
                    // álbum o de la canción, según el tipo de la lista—: sacarlo
                    // se hace desde "Administrar".
                    <li key={item.id}>
                      <GatedLink to={item.path} className="album-item">
                        <AlbumCover title={item.title} url={item.urlCover} size="lg" />
                        <div className="album-item__info">
                          <p className="album-item__title">{item.title}</p>
                          <p className="album-item__artist">{item.artistName}</p>
                          {item.releaseYear !== null && (
                            <p className="album-item__year">{item.releaseYear}</p>
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

            {/* Todo lo que se hace con los ítems de la lista va en este modal:
                se abre, se agregan y se quitan los que hagan falta de una
                sentada y se cierra. NO se cierra con cada cambio, justamente
                para poder encadenar varios. */}
            <FormModal
              isOpen={isManagerOpen}
              title={list.isSongList ? 'Administrar canciones' : 'Administrar álbumes'}
              error={manageError}
              onClose={() => setIsManagerOpen(false)}
            >
              <ListItemManager
                type={list.type}
                items={list.items}
                busyItemId={busyItemId}
                notice={manageNotice}
                onDismissNotice={() => setManageNotice(null)}
                onAdd={(itemId, title) => void handleChangeItem(itemId, title, 'added')}
                onRemove={(itemId, title) => void handleChangeItem(itemId, title, 'removed')}
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
