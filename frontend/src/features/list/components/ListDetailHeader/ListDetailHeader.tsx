// Encabezado de la ficha de una lista: de qué es, cómo se llama, quién la armó y
// las acciones (me gusta, compartir y, para su dueño Pro, editar y eliminar).
//
// No guarda la lista ni llama a la API: recibe los datos y avisa con on... lo que
// se apretó, y la página decide qué hacer. Lo único propio es copiar el enlace,
// que no le importa a nadie más.
import { Link } from 'react-router-dom';
import { Check, Heart, Lock, Pencil, Share2, Trash2 } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { Avatar } from '../../../../core/components/Avatar';
import { Button } from '../../../../core/components/Button';
import { IconButton } from '../../../../core/components/IconButton';
import { InlineNotice } from '../../../../core/components/InlineNotice';
import { useCopyLink } from '../../../../core/hooks/useCopyLink';
import { RoleBadge } from '../../../user/components/RoleBadge';
import type { List } from '../../models/List';
import './ListDetailHeader.scss';

type ListDetailHeaderProps = {
  list: List;
  /** Quien mira es el dueño, sea o no Pro. */
  isOwner: boolean;
  /** Dueño y además Pro: puede editar, borrar y administrar los ítems. */
  canManage: boolean;
  isLiking: boolean;
  isDeleting: boolean;
  /** Error de la última acción (me gusta, borrar), o null. */
  error: string | null;
  onToggleLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const ListDetailHeader = ({
  list,
  isOwner,
  canManage,
  isLiking,
  isDeleting,
  error,
  onToggleLike,
  onEdit,
  onDelete,
}: ListDetailHeaderProps) => {
  // Copia el enlace de la lista al portapapeles. La ficha es pública, así que
  // quien lo reciba la puede abrir aunque no tenga cuenta.
  const { copied, copy } = useCopyLink();

  return (
    <header className="list-header">
      {/* El encabezado dice de qué es la lista: es lo primero que hay que saber
          para entender qué se está mirando. */}
      <p className="list-header__eyebrow">
        {list.isSongList ? 'Lista de canciones' : 'Lista de álbumes'}
      </p>
      <h1 className="list-header__title">{list.name}</h1>

      <div className="list-header__meta">
        <Avatar url={list.user?.urlAvatar ?? null} username={list.authorName} size="sm" />
        <span>
          por <strong>@{list.authorName}</strong>{' '}
          <RoleBadge rol={list.authorRol} accent={list.authorAccent} /> · {list.dateLabel} ·{' '}
          {list.itemsLabel}
        </span>
      </div>

      {list.description && <p className="list-header__description">{list.description}</p>}

      <div className="list-header__actions">
        <Button
          variant={list.likedByMe ? 'success' : 'outline'}
          disabled={isLiking}
          onClick={onToggleLike}
        >
          <Heart size={16} aria-hidden="true" fill={list.likedByMe ? 'currentColor' : 'none'} />
          {list.likesLabel}
        </Button>

        {/* Al lado del corazón porque son las dos acciones que puede hacer
            cualquiera que entre, sea o no el dueño. Compartir no pide sesión: la
            ficha es pública y es justamente el enlace que se comparte. */}
        <Button variant="outline" onClick={() => void copy(list.sharePath)}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
          {copied ? '¡Enlace copiado!' : 'Compartir'}
        </Button>

        {canManage && (
          <>
            <Button variant="subtle" onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" />
              Editar
            </Button>
            <IconButton
              icon={<Trash2 size={16} />}
              label="Eliminar lista"
              tone="danger"
              disabled={isDeleting}
              onClick={onDelete}
            />
          </>
        )}
      </div>

      {/* Al dueño que ya no es Pro se le explica por qué no están los controles,
          en vez de dejarlo sin ellos y sin motivo. La lista sigue publicada y
          visible para todos. */}
      {isOwner && !canManage && (
        <InlineNotice icon={<Lock size={14} />}>
          Tu lista sigue publicada, pero para editarla necesitás la membresía{' '}
          <Link to="/pro" className="list-header__pro-link">
            Pro
          </Link>
          .
        </InlineNotice>
      )}

      {/* Mientras va el DELETE: el aviso de que se eliminó se muestra recién en
          /lists, que es a donde lleva la baja. */}
      {isDeleting && <InlineNotice icon={<Trash2 size={14} />}>Eliminando la lista...</InlineNotice>}

      {error && <Alert tone="error">{error}</Alert>}
    </header>
  );
};
