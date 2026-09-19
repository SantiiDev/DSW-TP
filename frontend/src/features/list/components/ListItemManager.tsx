// Contenido del modal "Administrar" de la ficha de una lista: las dos cosas que
// su dueño puede hacer con sus ítems, agregarlos y quitarlos, en un solo lugar y
// separadas por un selector de secciones.
//
// Antes eran dos controles sueltos en la pantalla: el botón "Agregar álbumes"
// abría un modal y cada tarjeta llevaba debajo su propio "Sacar de la lista".
// Juntarlas deja la grilla limpia (las tarjetas vuelven a ser solo el enlace a la
// ficha del ítem) y pone las dos operaciones donde se las busca.
//
// Solo decide qué sección se ve: el alta y la baja las resuelve la página, que
// es la que tiene la lista y habla con la API.
import { useState } from 'react';
import { Check, ListMusic, Minus, Trash2 } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { InlineNotice } from '../../../core/components/InlineNotice';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import type { SegmentOption } from '../../../core/components/SegmentedControl';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { ListItemPicker } from './ListItemPicker';
import type { ListItem, ListType } from '../models/List';
import '../styles/_list.scss';

/** Las dos secciones del modal, en el orden en que se muestran. */
const SECTIONS = [
  { value: 'add', label: 'Agregar' },
  { value: 'remove', label: 'Quitar' },
] as const satisfies readonly SegmentOption<string>[];

type ManagerSection = (typeof SECTIONS)[number]['value'];

/**
 * Aclaración de qué se hace en cada sección, debajo del selector. Cambia según
 * de qué sea la lista: no se buscan álbumes en una lista de canciones.
 */
const HINTS: Record<ListType, Record<ManagerSection, string>> = {
  album: {
    add: 'Buscá por título y sumá los álbumes que quieras. Se agregan a la lista al instante.',
    remove: 'Sacá los álbumes que ya no van. También se aplica al instante.',
  },
  song: {
    add: 'Buscá por título y sumá las canciones que quieras. Se agregan a la lista al instante.',
    remove: 'Sacá las canciones que ya no van. También se aplica al instante.',
  },
};

/** Qué dice el estado vacío de la sección "Quitar", según el tipo de lista. */
const EMPTY_MESSAGE: Record<ListType, string> = {
  album: 'Agregá álbumes desde la otra sección para poder quitarlos.',
  song: 'Agregá canciones desde la otra sección para poder quitarlas.',
};

/**
 * Lo último que se hizo, para confirmárselo al usuario. Viaja armado con el
 * título y no con la frase entera porque cómo se redacta es cosa de esta
 * pantalla, no de quien la maneja.
 */
export type ManageNotice = {
  kind: 'added' | 'removed';
  /** Título del ítem agregado o quitado. */
  title: string;
};

type ListItemManagerProps = {
  /** De qué es la lista: decide los textos y qué busca el buscador. */
  type: ListType;
  /** Los ítems que hoy tiene la lista: son los que se pueden quitar. */
  items: ListItem[];
  /** Ítem sobre el que hay una operación en curso, o null si no hay ninguna. */
  busyItemId: number | null;
  /** Aviso del último cambio, o null si no hubo ninguno todavía (o si ya se desvaneció). */
  notice: ManageNotice | null;
  /** Pide borrar el aviso. Lo usa el cambio de sección. */
  onDismissNotice: () => void;
  onAdd: (itemId: number, title: string) => void;
  onRemove: (itemId: number, title: string) => void;
};

export const ListItemManager = ({
  type,
  items,
  busyItemId,
  notice,
  onDismissNotice,
  onAdd,
  onRemove,
}: ListItemManagerProps) => {
  const [section, setSection] = useState<ManagerSection>('add');

  const isBusy = busyItemId !== null;

  /**
   * Cambia de sección y descarta el aviso: habla de lo que se hizo en la
   * sección que se está dejando, y leerlo arriba de la otra confundiría.
   */
  const handleSectionChange = (next: ManagerSection) => {
    setSection(next);
    onDismissNotice();
  };

  return (
    <div className="list-item-manager">
      <SegmentedControl
        options={SECTIONS}
        value={section}
        onChange={(next) => handleSectionChange(next)}
        ariaLabel="Qué hacer con los ítems de la lista"
      />

      <p className="list-item-manager__hint">{HINTS[type][section]}</p>

      {/* Confirmación de lo último que se hizo. El reloj que la borra lo lleva
          ListDetailPage, que es la que sabe cuándo terminó cada operación. */}
      {notice && (
        <InlineNotice
          tone={notice.kind === 'added' ? 'positive' : 'neutral'}
          icon={notice.kind === 'added' ? <Check size={14} /> : <Minus size={14} />}
        >
          {notice.kind === 'added' ? 'Se agregó ' : 'Se quitó '}
          <strong>{notice.title}</strong>
        </InlineNotice>
      )}

      {section === 'add' ? (
        <ListItemPicker
          type={type}
          // Los que ya están no se vuelven a ofrecer, así el que se acaba de
          // agregar desaparece solo de los resultados.
          excludeIds={items.map((item) => item.id)}
          isBusy={isBusy}
          // Del objeto que manda el buscador alcanza con el id, que es lo que
          // pide la API, y el título, que es lo que después dice el aviso.
          onAdd={(item) => onAdd(item.id, item.title)}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ListMusic size={22} />}
          title="La lista está vacía."
          message={EMPTY_MESSAGE[type]}
        />
      ) : (
        <ul className="list-item-manager__items">
          {items.map((item) => (
            <li key={item.id} className="list-item-manager__item">
              <AlbumCover title={item.title} url={item.urlCover} size="sm" />
              <div className="list-item-manager__item-info">
                <p className="list-item-manager__item-title">{item.title}</p>
                <p className="list-item-manager__item-artist">{item.artistName}</p>
              </div>
              <Button
                size="sm"
                variant="subtle"
                disabled={isBusy}
                onClick={() => onRemove(item.id, item.title)}
              >
                <Trash2 size={14} aria-hidden="true" />
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
