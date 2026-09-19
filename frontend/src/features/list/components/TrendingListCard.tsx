// Tarjeta de una lista en el feed de "Listas en Tendencia": el collage de
// portadas, el nombre, su autor, la descripción y la fila de datos al pie, con
// el botón de compartir a la derecha.
//
// Vive en su propio archivo y no dentro de TrendingListsSection por el botón de
// compartir: cada tarjeta necesita su propio "¡Copiado!", y un hook no se puede
// llamar adentro de un map. Con una sola instancia del hook en la sección, al
// compartir una lista se encenderían todas a la vez.
//
// El enlace NO envuelve la tarjeta entera, a propósito: un <button> adentro de
// un <a> es HTML inválido y el click terminaría navegando en vez de copiar el
// enlace. Por eso la tarjeta es un <article> y el enlace cubre solo el collage y
// el cuerpo, que es lo que se aprieta para entrar. Es el mismo reparto que usa
// ReviewCard.
import { Calendar, Check, Heart, Music, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../core/components/Avatar';
import { useCopyLink } from '../../../core/hooks/useCopyLink';
import type { List } from '../models/List';

type TrendingListCardProps = {
  list: List;
};

export const TrendingListCard = ({ list }: TrendingListCardProps) => {
  const { copied, copy } = useCopyLink();

  return (
    <article className="trending-list-card">
      <Link to={list.sharePath} className="trending-list-card__link">
        <div className="trending-list-card__collage">
          {list.covers.map((cover, index) =>
            cover ? (
              <img
                key={index}
                src={cover}
                alt={`Portada ${index + 1} de ${list.name}`}
                className="trending-list-card__collage-img"
                loading="lazy"
              />
            ) : (
              // Slot vacío para las listas con menos de cinco ítems: la grilla
              // del collage es fija en cinco columnas.
              <span
                key={index}
                className="trending-list-card__collage-img trending-list-card__collage-img--empty"
                aria-hidden="true"
              />
            )
          )}
        </div>

        <div className="trending-list-card__body">
          <h3 className="trending-list-card__title">{list.name}</h3>

          <div className="trending-list-card__author">
            <Avatar url={list.user?.urlAvatar ?? null} username={list.authorName} size="sm" />
            <span className="trending-list-card__username">@{list.authorName}</span>
          </div>

          {list.description && (
            <p className="trending-list-card__description">{list.description}</p>
          )}
        </div>
      </Link>

      {/* Queda fuera del enlace: acá adentro hay un botón. */}
      <div className="trending-list-card__footer">
        <div className="trending-list-card__stats">
          <span className="trending-list-card__stat">
            <Music size={14} aria-hidden="true" />
            {list.itemsLabel}
          </span>
          <span className="trending-list-card__stat">
            <Heart size={14} aria-hidden="true" />
            {list.likesLabel}
          </span>
          <span className="trending-list-card__stat">
            <Calendar size={14} aria-hidden="true" />
            {list.dateLabel}
          </span>
        </div>

        <button
          type="button"
          className="trending-list-card__share"
          aria-label={`Copiar el enlace de ${list.name}`}
          title="Compartir"
          onClick={() => void copy(list.sharePath)}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
          <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </div>
    </article>
  );
};
