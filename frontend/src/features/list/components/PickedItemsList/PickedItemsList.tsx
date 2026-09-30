// Ítems ya elegidos en el alta de una lista, cada uno con su botón para sacarlo.
// Es solo el dibujo: la selección la guarda ListForm.
import { X } from 'lucide-react';
import { IconButton } from '../../../../core/components/IconButton';
import { AlbumCover } from '../../../genre/components/AlbumCover';
import type { PickedItem } from '../ListItemPicker';
import './PickedItemsList.scss';

type PickedItemsListProps = {
  items: PickedItem[];
  /** Hay un envío en curso: deshabilita los botones de sacar. */
  isBusy: boolean;
  onRemove: (itemId: number) => void;
};

export const PickedItemsList = ({ items, isBusy, onRemove }: PickedItemsListProps) => {
  return (
    <ul className="picked-items">
      {items.map((item) => (
        <li key={item.id} className="picked-items__item">
          <AlbumCover title={item.title} url={item.urlCover} size="sm" />
          <div className="picked-items__info">
            <p className="picked-items__title">{item.title}</p>
            <p className="picked-items__artist">{item.artistName}</p>
          </div>
          <IconButton
            icon={<X size={16} />}
            label={`Sacar ${item.title}`}
            tone="danger"
            disabled={isBusy}
            onClick={() => onRemove(item.id)}
          />
        </li>
      ))}
    </ul>
  );
};
