// Panel "Más activos" de la página /reviews: el ranking global de la comunidad.
//
// Va debajo de "Gente para seguir" y responde otra pregunta: aquel recomienda a
// quién te falta seguir, este muestra quién sostiene la comunidad, siga quien
// siga a quién. Por eso incluye a todos, también al que mira.
//
// Es una sola lista: el orden lo decide un puntaje que combina las reseñas
// publicadas con los seguidores, y por eso cada fila muestra los dos números.
// Todo eso lo calcula la API (ver ACTIVITY_SCORE en follow.repository.ts); acá
// solo se dibuja lo que llega, en el orden en que llega.
//
// A diferencia del panel de sugerencias, las filas NO llevan botón de seguir:
// el panel de arriba ya lo tiene en cada fila y repetirlo sería ruido. Acá cada
// fila lleva al perfil, y sin sesión ese link abre el registro (lo resuelve el
// GatedLink que ya trae UserRow).
import { Trophy } from 'lucide-react';
import { Loader } from '../../../core/components/Loader';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useFetch } from '../../../core/hooks/useFetch';
import { followService } from '../services/followService';
import { UserRow } from './UserRow';
import '../styles/_user-ranking.scss';

export const UserRankingPanel = () => {
  const { data, isLoading, error } = useFetch(() => followService.ranking());
  const users = data ?? [];

  return (
    <section className="user-ranking">
      {/* El dorado es el tono que el componente reserva para los rankings. */}
      <SectionHeader icon={<Trophy size={20} />} iconTone="gold" title="Más activos" />

      {isLoading ? (
        <Loader message="Armando el ranking..." />
      ) : error ? (
        <p className="user-ranking__message user-ranking__message--error">{error}</p>
      ) : users.length === 0 ? (
        <p className="user-ranking__message">
          Todavía no hay suficiente actividad para armar el ranking.
        </p>
      ) : (
        <ol className="user-ranking__list">
          {users.map((user, index) => (
            <li key={user.id} className="user-ranking__item">
              <span className="user-ranking__rank">{index + 1}</span>
              {/* Se muestran los dos números porque los dos entran en el puntaje:
                  con uno solo, un puesto por encima de otro no se entendería. */}
              <UserRow user={user} meta={`${user.reviewsLabel} · ${user.followersLabel}`} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
