// Botón "Agregar a una lista" de la ficha de un álbum o de una canción.
//
// Es el único punto de esta feature que vive del lado de otras (se usa desde
// AlbumActions, en features/album, y desde SongDetailPage, en features/song):
// abre un modal con las listas propias DEL MISMO TIPO que el ítem, para sumarlo
// o sacarlo de cada una, y una opción para crear una lista nueva sin salir de la
// ficha.
//
// Filtrar por tipo no es cosmético: una lista de canciones no puede recibir un
// álbum, así que ofrecerla sería ofrecer algo que la API va a rechazar.
//
// Sin sesión, abre el modal de registro, igual que cualquier otra acción que
// pide cuenta en Musicboxd. Con sesión pero sin Pro, muestra el aviso de
// ProOnlyNotice: armar listas es un beneficio de la membresía.
import { useState } from 'react';
import { Check, ListPlus, Plus } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { listService } from '../services/listService';
import type { ListInput } from '../services/listService';
import type { ListType } from '../models/List';
import { ListForm } from './ListForm';
import { ProOnlyNotice } from './ProOnlyNotice';
import '../styles/_list.scss';

/**
 * El ítem que se quiere agregar, reducido a lo que hace falta acá: su tipo (para
 * filtrar las listas), su id (para la API) y con qué dibujarlo en el formulario
 * de alta, que lo muestra ya elegido.
 */
export type AddToListItem = {
  kind: ListType;
  id: number;
  title: string;
  urlCover: string | null;
  artistName: string;
};

/** Los textos que cambian según qué se está agregando. */
const COPY: Record<ListType, { empty: string }> = {
  album: { empty: 'Todavía no tenés ninguna lista de álbumes.' },
  song: { empty: 'Todavía no tenés ninguna lista de canciones.' },
};

type AddToListButtonProps = {
  item: AddToListItem;
};

export const AddToListButton = ({ item }: AddToListButtonProps) => {
  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();
  const isAuthenticated = authState.status === 'authenticated';
  const canCreate = authState.user?.isPro ?? false;

  const [isOpen, setIsOpen] = useState(false);
  // 'browse' es el modo por defecto (agregar/sacar de una lista existente);
  // 'create' reemplaza el contenido del modal por el alta de una lista nueva.
  const [mode, setMode] = useState<'browse' | 'create'>('browse');
  const [busyListId, setBusyListId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se piden recién al abrir el modal, y no de entrada en la ficha: es un dato
  // que solo hace falta si el usuario llega a apretar el botón.
  const { data, isLoading, reload } = useFetch(
    () => (isOpen ? listService.listMine() : Promise.resolve([])),
    isOpen ? 'open' : 'closed'
  );
  // Se filtra acá y no con el parámetro `type` de la API porque listMine() no lo
  // acepta: trae siempre todas las propias, que es lo que también necesita la
  // barra lateral de /lists.
  const lists = (data ?? []).filter((list) => list.type === item.kind);

  const handleOpen = () => {
    if (!isAuthenticated) {
      openSignup();
      return;
    }

    setMode('browse');
    setError(null);
    setIsOpen(true);
  };

  /** Agrega o saca el ítem de una lista, según si ya estaba. */
  const handleToggle = async (listId: number, alreadyIn: boolean) => {
    setBusyListId(listId);
    setError(null);

    try {
      if (alreadyIn) await listService.removeItem(listId, item.id);
      else await listService.addItem(listId, item.id);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyListId(null);
    }
  };

  /**
   * Crea la lista con los ítems elegidos, que ya incluyen a este: es para lo
   * que se abrió el modal. Va en una sola request porque el alta acepta los
   * ítems (ver createListSchema); antes eran dos, y si la segunda fallaba
   * quedaba una lista vacía dando vueltas.
   */
  const handleCreate = async (input: ListInput): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      await listService.create(input);
      await reload();
      setMode('browse');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button variant="outline" fullWidth onClick={handleOpen}>
        <ListPlus size={16} aria-hidden="true" />
        Agregar a una lista
      </Button>

      <FormModal
        isOpen={isOpen}
        title={mode === 'create' ? 'Crear lista' : 'Agregar a una lista'}
        error={error}
        isBusy={isCreating}
        onClose={() => setIsOpen(false)}
      >
        {/* Un FREE no puede armar listas, así que no tiene sentido mostrarle ni
            el formulario ni sus propias listas: va directo el aviso. */}
        {!canCreate ? (
          <ProOnlyNotice />
        ) : mode === 'create' ? (
          <ListForm
            // Arranca con este ítem ya elegido y con su tipo fijado: es el que
            // se estaba mirando, así que el alta cumple de entrada la regla de
            // "al menos un ítem" y no hay nada que elegir sobre de qué va la
            // lista.
            initialType={item.kind}
            initialItems={[
              {
                id: item.id,
                title: item.title,
                urlCover: item.urlCover,
                artistName: item.artistName,
              },
            ]}
            canChooseType={false}
            isSubmitting={isCreating}
            submitLabel="Crear y agregar"
            onSubmit={handleCreate}
            onCancel={() => setMode('browse')}
          />
        ) : isLoading ? (
          <Loader message="Cargando tus listas..." />
        ) : (
          <div className="add-to-list">
            {lists.length === 0 ? (
              <p className="add-to-list__empty">{COPY[item.kind].empty}</p>
            ) : (
              <ul className="add-to-list__lists">
                {lists.map((list) => {
                  const alreadyIn = list.hasItem(item.id);

                  return (
                    <li key={list.id} className="add-to-list__item">
                      <span className="add-to-list__item-name">{list.name}</span>
                      <Button
                        size="sm"
                        variant={alreadyIn ? 'success' : 'outline'}
                        disabled={busyListId === list.id}
                        onClick={() => handleToggle(list.id, alreadyIn)}
                      >
                        {alreadyIn ? (
                          <>
                            <Check size={14} aria-hidden="true" />
                            Agregado
                          </>
                        ) : (
                          'Agregar'
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button variant="subtle" fullWidth onClick={() => setMode('create')}>
              <Plus size={16} aria-hidden="true" />
              Crear una lista nueva
            </Button>
          </div>
        )}
      </FormModal>
    </>
  );
};
