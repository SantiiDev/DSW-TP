// Tarjeta de una solicitud dentro de la cola de moderación del panel de
// administración: qué se propuso, quién lo mandó, en qué estado está y los
// botones para resolverla.
//
// Las tres entidades aportables (artista, álbum y canción) tienen exactamente la
// misma tarjeta: lo único que cambia es el detalle del medio, que es propio de
// cada una (la biografía del artista, el artista y el año del álbum, el álbum y
// la pista de la canción). Ese detalle lo pone cada feature como `children`.
//
//   <RequestCard
//     title={album.title}
//     badge={<Badge tone={...}>{...}</Badge>}
//     author={album.creatorName}
//     actions={<>...</>}
//   >
//     <p className="request-card__detail">{album.artistName} · {album.yearLabel}</p>
//   </RequestCard>
//
// Para el detalle hay dos clases listas: `request-card__detail` y su variante
// `request-card__detail--empty`, para cuando el aporte no incluyó ese dato.
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import './_request-card.scss';

type RequestCardProps = {
  title: string;
  /** Pastilla de estado, a la derecha del título (normalmente un Badge). */
  badge: ReactNode;
  /** Nombre de quien mandó el aporte. */
  author: string;
  /** Detalle propio de la entidad. */
  children: ReactNode;
  /** Botones de aprobar y rechazar. */
  actions: ReactNode;
};

export const RequestCard = ({ title, badge, author, children, actions }: RequestCardProps) => {
  return (
    <li className="request-card">
      <div className="request-card__head">
        <h4 className="request-card__title">{title}</h4>
        {badge}
      </div>

      <p className="request-card__author">
        <UserRound size={14} aria-hidden="true" />
        Propuesto por {author}
      </p>

      <div className="request-card__body">{children}</div>

      <div className="request-card__actions">{actions}</div>
    </li>
  );
};
