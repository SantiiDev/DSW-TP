// Sección "Mis listas": accesos directos a las listas propias y el alta de una
// nueva. Solo se muestra con sesión iniciada; sin ella, /lists sigue siendo la
// vitrina pública de siempre (el resto de las secciones no piden cuenta).
//
// El alta es un beneficio Pro. A un FREE el botón igual se le muestra, y lo que
// cambia es qué hay adentro del modal: en vez del formulario, el cartel que
// explica por qué no puede y lo invita a /pro (ver ProOnlyNotice).
import { useState } from 'react';
import { ChevronDown, ChevronUp, ListMusic, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { FormModal } from '../../../core/components/FormModal';
import { Loader } from '../../../core/components/Loader';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { listService } from '../services/listService';
import type { ListInput } from '../services/listService';
import { ListForm } from './ListForm';
import { ProOnlyNotice } from './ProOnlyNotice';
import '../styles/_list.scss';

/**
 * Cuántas listas se muestran plegadas. Las demás esperan detrás de "Ver más":
 * este bloque comparte la barra lateral con el ranking y los géneros, y con
 * quince listas propias empujaría a los dos fuera de la pantalla.
 */
const VISIBLE_LIMIT = 5;

export const MyListsSection = () => {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.status === 'authenticated';
  // Armar listas es un beneficio Pro. Es solo para no ofrecer lo que va a
  // fallar: quien corta de verdad es la API.
  const canCreate = authState.user?.isPro ?? false;

  // Sin sesión no hay nada que pedir: se pasa una clave fija para no reintentar
  // en cada render, y el componente no llega a dibujar nada de todos modos.
  const { data, isLoading, error, reload } = useFetch(
    () => (isAuthenticated ? listService.listMine() : Promise.resolve([])),
    isAuthenticated ? 'mine' : 'guest'
  );
  const lists = data ?? [];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Plegado o desplegado del listado. Arranca plegado: lo normal es venir a
  // /lists a explorar, no a revisar las propias.
  const [showAll, setShowAll] = useState(false);

  // La vitrina pública de /lists no cambia si no hay cuenta: esta sección
  // simplemente no aparece, en vez de mostrar un login disfrazado de sección.
  if (!isAuthenticated) return null;

  const hasMore = lists.length > VISIBLE_LIMIT;
  const visibleLists = showAll ? lists : lists.slice(0, VISIBLE_LIMIT);

  const handleCreate = async (input: ListInput): Promise<boolean> => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await listService.create(input);
      // Se recarga en vez de agregar a mano: así la lista nueva aparece con el
      // mismo orden (las más nuevas primero) que devuelve la API.
      await reload();
      setIsFormOpen(false);
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-lists">
      <SectionHeader icon={<ListMusic size={20} />} title="Mis Listas" />

      <Button variant="outline" fullWidth onClick={() => setIsFormOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Crear lista
      </Button>

      {isLoading ? (
        <Loader message="Cargando tus listas..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : lists.length > 0 ? (
        <>
          {/* Desplegado, el listado scrollea dentro de su propia caja en vez de
              estirar la barra lateral (ver el modificador en _list.scss). */}
          <ul className={`my-lists__list ${showAll ? 'my-lists__list--expanded' : ''}`}>
            {visibleLists.map((list) => (
              <li key={list.id}>
                <Link to={`/lists/${list.id}`} className="my-lists__item">
                  <span className="my-lists__item-name">{list.name}</span>
                  <span className="my-lists__item-count">{list.itemsLabel}</span>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button variant="subtle" fullWidth onClick={() => setShowAll((current) => !current)}>
              {showAll ? (
                <>
                  <ChevronUp size={16} aria-hidden="true" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown size={16} aria-hidden="true" />
                  Ver más ({lists.length - VISIBLE_LIMIT})
                </>
              )}
            </Button>
          )}
        </>
      ) : (
        <p className="my-lists__empty">Todavía no armaste ninguna lista.</p>
      )}

      <FormModal
        isOpen={isFormOpen}
        title="Crear lista"
        // El aviso para un FREE se explica solo: la ayuda del formulario sobraría.
        hint={
          canCreate
            ? 'Elegí si va a ser una lista de álbumes o de canciones: una lista no puede tener las dos cosas. Después ponele un nombre y buscá lo que la va a formar.'
            : undefined
        }
        error={formError}
        isBusy={isSubmitting}
        onClose={() => setIsFormOpen(false)}
      >
        {canCreate ? (
          <ListForm
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
          />
        ) : (
          <ProOnlyNotice />
        )}
      </FormModal>
    </section>
  );
};
