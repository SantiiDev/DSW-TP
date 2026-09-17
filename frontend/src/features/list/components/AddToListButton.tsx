// Botón "Agregar a una lista" de la ficha del álbum.
//
// Es el único punto de esta feature que vive del lado de otra (se usa desde
// AlbumActions, en features/album): abre un modal con las listas propias, para
// sumar o sacar este álbum de cada una, y una opción para crear una lista nueva
// sin salir de la ficha. Sin sesión, abre el modal de registro, igual que
// cualquier otra acción que pide cuenta en Musicboxd.
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
import type { Album } from '../../album/models/Album';
import { ListForm } from './ListForm';
import '../styles/_list.scss';

type AddToListButtonProps = {
  /**
   * El álbum entero y no solo su id: al crear una lista desde acá, el
   * formulario arranca con este disco ya elegido y necesita su título y su
   * portada para dibujarlo.
   */
  album: Album;
};

export const AddToListButton = ({ album }: AddToListButtonProps) => {
  const albumId = album.id;

  const { state: authState } = useAuth();
  const { openSignup } = useAuthModal();
  const isAuthenticated = authState.status === 'authenticated';

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
  const lists = data ?? [];

  const handleOpen = () => {
    if (!isAuthenticated) {
      openSignup();
      return;
    }

    setMode('browse');
    setError(null);
    setIsOpen(true);
  };

  /** Agrega o saca el álbum de una lista, según si ya estaba. */
  const handleToggle = async (listId: number, alreadyIn: boolean) => {
    setBusyListId(listId);
    setError(null);

    try {
      if (alreadyIn) await listService.removeAlbum(listId, albumId);
      else await listService.addAlbum(listId, albumId);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyListId(null);
    }
  };

  /**
   * Crea la lista con los álbumes elegidos, que ya incluyen a este: es para lo
   * que se abrió el modal. Va en una sola request porque el alta acepta los
   * álbumes (ver createListSchema); antes eran dos, y si la segunda fallaba
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
        {mode === 'create' ? (
          <ListForm
            // Arranca con este álbum ya elegido: es el que se estaba mirando, y
            // así el alta cumple de entrada la regla de "al menos un álbum".
            initialAlbums={[
              {
                id: album.id,
                title: album.title,
                urlCover: album.urlCover,
                artistName: album.artistName,
              },
            ]}
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
              <p className="add-to-list__empty">Todavía no tenés ninguna lista.</p>
            ) : (
              <ul className="add-to-list__lists">
                {lists.map((list) => {
                  const alreadyIn = list.hasAlbum(albumId);

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
