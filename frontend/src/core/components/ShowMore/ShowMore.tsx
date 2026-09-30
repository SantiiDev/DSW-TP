// Pie de un listado paginado del lado del cliente: cuántas filas se ven y el
// botón para traer más. Va de la mano con el hook useShowMore.
//
//   {hasMore && (
//     <ShowMore shown={visibleItems.length} total={albums.length} noun="álbumes" onShowMore={showMore} />
//   )}
import { Button } from '../Button';
import './ShowMore.scss';

type ShowMoreProps = {
  /** Cuántos se están mostrando. */
  shown: number;
  /** Cuántos hay en total. */
  total: number;
  /** Qué se cuenta, en plural ("álbumes", "solicitudes"). */
  noun: string;
  /** Texto del botón. Por defecto, "Ver más <noun>". */
  buttonLabel?: string;
  onShowMore: () => void;
};

export const ShowMore = ({ shown, total, noun, buttonLabel, onShowMore }: ShowMoreProps) => {
  return (
    <div className="show-more">
      <p className="show-more__count">
        Mostrando {shown} de {total} {noun}.
      </p>
      <Button variant="outline" onClick={onShowMore}>
        {buttonLabel ?? `Ver más ${noun}`}
      </Button>
    </div>
  );
};
