// Contenido del modal "Administrar álbumes" de la ficha de una lista: las dos
// cosas que su dueño puede hacer con los álbumes, agregarlos y quitarlos, en un
// solo lugar y separadas por un selector de secciones.
//
// Antes eran dos controles sueltos en la pantalla: el botón "Agregar álbumes"
// abría un modal y cada tarjeta de álbum llevaba debajo su propio "Sacar de la
// lista". Juntarlas deja la grilla limpia (las tarjetas vuelven a ser solo el
// enlace a la ficha del álbum) y pone las dos operaciones donde se las busca.
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
import { ListAlbumPicker } from './ListAlbumPicker';
import type { ListAlbum } from '../models/List';
import '../styles/_list.scss';

/** Las dos secciones del modal, en el orden en que se muestran. */
const SECTIONS = [
  { value: 'add', label: 'Agregar álbumes' },
  { value: 'remove', label: 'Quitar álbumes' },
] as const satisfies readonly SegmentOption<string>[];

type ManagerSection = (typeof SECTIONS)[number]['value'];

/** Aclaración de qué se hace en cada sección, debajo del selector. */
const HINTS: Record<ManagerSection, string> = {
  add: 'Buscá por título y sumá los que quieras. Se agregan a la lista al instante.',
  remove: 'Sacá los que ya no van. También se aplica al instante.',
};

/**
 * Lo último que se hizo, para confirmárselo al usuario. Viaja armado con el
 * título y no con la frase entera porque cómo se redacta es cosa de esta
 * pantalla, no de quien la maneja.
 */
export type ManageNotice = {
  kind: 'added' | 'removed';
  /** Título del álbum agregado o quitado. */
  title: string;
};

type ListAlbumManagerProps = {
  /** Los álbumes que hoy tiene la lista: son los que se pueden quitar. */
  albums: ListAlbum[];
  /** Álbum sobre el que hay una operación en curso, o null si no hay ninguna. */
  busyAlbumId: number | null;
  /** Aviso del último cambio, o null si no hubo ninguno todavía (o si ya se desvaneció). */
  notice: ManageNotice | null;
  /** Pide borrar el aviso. Lo usa el cambio de sección. */
  onDismissNotice: () => void;
  onAdd: (albumId: number, title: string) => void;
  onRemove: (albumId: number, title: string) => void;
};

export const ListAlbumManager = ({
  albums,
  busyAlbumId,
  notice,
  onDismissNotice,
  onAdd,
  onRemove,
}: ListAlbumManagerProps) => {
  const [section, setSection] = useState<ManagerSection>('add');

  const isBusy = busyAlbumId !== null;

  /**
   * Cambia de sección y descarta el aviso: habla de lo que se hizo en la
   * sección que se está dejando, y leerlo arriba de la otra confundiría.
   */
  const handleSectionChange = (next: ManagerSection) => {
    setSection(next);
    onDismissNotice();
  };

  return (
    <div className="list-album-manager">
      <SegmentedControl
        options={SECTIONS}
        value={section}
        onChange={(next) => handleSectionChange(next)}
        ariaLabel="Qué hacer con los álbumes de la lista"
      />

      <p className="list-album-manager__hint">{HINTS[section]}</p>

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
        <ListAlbumPicker
          // Los que ya están no se vuelven a ofrecer, así el que se acaba de
          // agregar desaparece solo de los resultados.
          excludeIds={albums.map((album) => album.id)}
          isBusy={isBusy}
          // Del objeto que manda el buscador alcanza con el id, que es lo que
          // pide la API, y el título, que es lo que después dice el aviso.
          onAdd={(album) => onAdd(album.id, album.title)}
        />
      ) : albums.length === 0 ? (
        <EmptyState
          icon={<ListMusic size={22} />}
          title="La lista está vacía."
          message="Agregá álbumes desde la otra sección para poder quitarlos."
        />
      ) : (
        <ul className="list-album-manager__items">
          {albums.map((album) => (
            <li key={album.id} className="list-album-manager__item">
              <AlbumCover title={album.title} url={album.urlCover} size="sm" />
              <div className="list-album-manager__item-info">
                <p className="list-album-manager__item-title">{album.title}</p>
                <p className="list-album-manager__item-artist">{album.artistName}</p>
              </div>
              <Button
                size="sm"
                variant="subtle"
                disabled={isBusy}
                onClick={() => onRemove(album.id, album.title)}
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
