// Otras listas del mismo usuario, al pie de la ficha de una lista.
//
// Es la salida natural de la pantalla, con el mismo criterio que "Más de
// <artista>" en la ficha de un álbum (ver AlbumMoreFromArtist): quien entró a
// una lista curada por alguien suele querer ver qué más armó esa persona, y hoy
// la única forma de llegar es volver a /lists y buscarla a mano.
//
// Cada una se dibuja con su collage de portadas, que es lo que identifica a una
// lista de un vistazo, igual que en el feed de /lists.
//
// NO filtra por tipo a propósito: acá aparecen todas las listas de esa persona,
// sean de álbumes o de canciones. Lo que se está mostrando es qué más armó, y
// partirlo en dos bloques por tipo sería esconder la mitad sin ningún motivo.
import { Link } from 'react-router-dom';
import { Heart, Music } from 'lucide-react';
import { Loader } from '../../../core/components/Loader';
import { useFetch } from '../../../core/hooks/useFetch';
import { listService } from '../services/listService';
import '../styles/_list.scss';

/** Cuántas listas se muestran como mucho. Es una sugerencia, no un listado. */
const MAX_LISTS = 4;

type ListMoreFromUserProps = {
  userId: number;
  username: string;
  /** La lista que se está viendo: se saca del listado para no ofrecerla de nuevo. */
  currentListId: number;
};

export const ListMoreFromUser = ({ userId, username, currentListId }: ListMoreFromUserProps) => {
  // Se pide una de más: si entre las que vuelven está la que se está viendo, al
  // filtrarla igual quedan MAX_LISTS para mostrar.
  const { data, isLoading, error } = useFetch(
    () => listService.list({ idUser: userId, sort: 'recent', limit: MAX_LISTS + 1 }),
    userId
  );

  const lists = (data ?? []).filter((list) => list.id !== currentListId).slice(0, MAX_LISTS);

  return (
    <section className="more-lists">
      <header className="more-lists__head">
        <h2 className="more-lists__title">Más listas de @{username}</h2>
      </header>

      {isLoading ? (
        <Loader message="Buscando más listas..." />
      ) : error ? (
        // Es un bloque secundario: si falla, se avisa en gris y la ficha sigue
        // siendo perfectamente usable. Un Alert rojo acá asustaría de más.
        <p className="more-lists__note">No pudimos traer las otras listas.</p>
      ) : lists.length === 0 ? (
        <p className="more-lists__note">@{username} todavía no armó otras listas.</p>
      ) : (
        <ul className="more-lists__grid">
          {lists.map((list) => (
            <li key={list.id}>
              <Link to={`/lists/${list.id}`} className="more-lists__card">
                <div className="more-lists__collage">
                  {list.covers.map((cover, index) =>
                    cover ? (
                      <img
                        key={index}
                        src={cover}
                        alt=""
                        className="more-lists__collage-img"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        key={index}
                        className="more-lists__collage-img more-lists__collage-img--empty"
                        aria-hidden="true"
                      />
                    )
                  )}
                </div>

                <span className="more-lists__name">{list.name}</span>
                <span className="more-lists__meta">
                  <span className="more-lists__stat">
                    <Music size={13} aria-hidden="true" />
                    {list.itemsLabel}
                  </span>
                  <span className="more-lists__stat">
                    <Heart size={13} aria-hidden="true" />
                    {list.likesLabel}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
