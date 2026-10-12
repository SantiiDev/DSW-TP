// Sección de listas top: ranking de las listas con más "me gusta" de la comunidad.
import { Heart, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../../core/components/Alert';
import { EmptyState } from '../../../../core/components/EmptyState';
import { Loader } from '../../../../core/components/Loader';
import { SectionHeader } from '../../../../core/components/SectionHeader';
import { useFetch } from '../../../../core/hooks/useFetch';
import { RoleBadge } from '../../../user/components/RoleBadge';
import { listService } from '../../services/listService';
import './TopListsSection.scss';

/**
 * Cuántas listas entran en el ranking. Con 5 la barra lateral (Mis Listas, Top
 * Listas y Explorar por Género) entra completa en la pantalla; con más,
 * "Explorar por Género" quedaba cortado abajo.
 */
const TOP_SIZE = 5;

export const TopListsSection = () => {
  const { data, isLoading, error } = useFetch(() =>
    listService.list({ sort: 'top', limit: TOP_SIZE })
  );
  const lists = data ?? [];

  return (
    <section className="top-lists">
      <SectionHeader icon={<Trophy size={20} />} title="Top Listas" iconTone="gold" />

      {isLoading ? (
        <Loader message="Cargando el ranking..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : lists.length === 0 ? (
        <EmptyState
          title="Todavía no hay listas con me gusta."
          message="Armá una desde &quot;Mis listas&quot; y sé el primero en aparecer acá."
        />
      ) : (
        <div className="top-lists__list">
          {lists.map((list, index) => (
            <Link key={list.id} to={`/lists/${list.id}`} className="top-list-item">
              <span className="top-list-item__rank">{index + 1}</span>
              <div className="top-list-item__info">
                <h3 className="top-list-item__title">{list.name}</h3>
                <p className="top-list-item__meta">
                  {list.itemsLabel} · por{' '}
                  <span className="top-list-item__author">@{list.authorName}</span>{' '}
                  <RoleBadge rol={list.authorRol} accent={list.authorAccent} />
                </p>
              </div>
              <div className="top-list-item__likes">
                <Heart size={14} aria-hidden="true" />
                <span>{list.likesLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
