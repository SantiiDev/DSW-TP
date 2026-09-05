// Contenido de la pestaña activa del perfil.
//
// Cada feature aporta su propia lista y esta página solo la monta: así lo hacen
// "Aportes" (con las de artista, álbum y canción), "Reseñas" y las dos pestañas
// de calificados (las tres, con las de review).
//
// La única que todavía muestra su vacío definitivo es "Resumen": la actividad
// reciente depende de un feed que no está implementado. Cuando exista, se
// reemplaza el EmptyState por el listado real sin tocar ni la cabecera ni la
// navegación de pestañas.
import { useState } from 'react';
import { Activity } from 'lucide-react';
import { ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import type { SegmentOption } from '../../../core/components/SegmentedControl';
import type { User } from '../models/User';
import { AlbumContributionsList } from '../../album/components/AlbumContributionsList';
import { ArtistContributionsList } from '../../artist/components/ArtistContributionsList';
import { SongContributionsList } from '../../song/components/SongContributionsList';
import { MembershipPanel } from '../../membership/components/MembershipPanel';
import { RatedItemsList } from '../../review/components/RatedItemsList';
import { UserReviewsList } from '../../review/components/UserReviewsList';
import type { ProfileTab } from './ProfileTabs';

type ProfileTabContentProps = {
  user: User;
  isOwnProfile: boolean;
  activeTab: ProfileTab;
  /** Avisa cuando cambian las reseñas, para refrescar los contadores del perfil. */
  onReviewsChange?: () => void;
};

/**
 * Las tres entidades que un usuario Pro puede aportar al catálogo. Se muestra una
 * por vez, elegida con un selector de segmentos: el mismo criterio que usa la
 * pestaña "Música" del panel de administración. Apiladas, las tres listas hacían
 * una pantalla larguísima donde el aporte que se buscaba quedaba abajo de todo.
 */
const CONTRIBUTION_KINDS = [
  { value: 'artists', label: 'Artistas' },
  { value: 'albums', label: 'Álbumes' },
  { value: 'songs', label: 'Canciones' },
] as const satisfies readonly SegmentOption<string>[];

type ContributionKind = (typeof CONTRIBUTION_KINDS)[number]['value'];

/** Textos del vacío según se mire el perfil propio o el de otro. */
function emptyCopy(isOwnProfile: boolean, own: string, other: string): string {
  return isOwnProfile ? own : other;
}

export const ProfileTabContent = ({
  user,
  isOwnProfile,
  activeTab,
  onReviewsChange,
}: ProfileTabContentProps) => {
  const name = user.username;

  // Qué tipo de aporte se está mirando. Va acá arriba y no dentro del case porque
  // los hooks tienen que llamarse siempre, en el mismo orden, en todos los
  // renders: adentro del switch se saltearía en las otras pestañas.
  const [contributionKind, setContributionKind] = useState<ContributionKind>('artists');

  switch (activeTab) {
    case 'resumen':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Actividad reciente</h2>
          <EmptyState
            icon={<Activity size={22} />}
            title={emptyCopy(isOwnProfile, 'Todavía no tenés actividad.', `${name} no tiene actividad todavía.`)}
            message={emptyCopy(
              isOwnProfile,
              'Cuando califiques un álbum o una canción, tu actividad va a aparecer acá.',
              'Cuando publique su primera reseña, va a aparecer en esta sección.'
            )}
            action={
              isOwnProfile ? (
                <ButtonLink to="/music" size="sm">
                  Explorar música
                </ButtonLink>
              ) : undefined
            }
          />
        </section>
      );

    case 'reviews':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Reseñas</h2>

          {/* La lista la pone la feature review, con su filtro por estrellas y su
              propio estado de carga y de vacío. */}
          <UserReviewsList
            userId={user.id}
            username={name}
            isOwnProfile={isOwnProfile}
            onReviewsChange={onReviewsChange}
          />
        </section>
      );

    // Las dos pestañas siguientes salen de las reseñas: lo que un usuario
    // calificó son sus reseñas miradas del lado del ítem. La grilla la pone la
    // feature review, con su propio paginado y sus estados de carga y de vacío.
    case 'albums':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Álbumes calificados</h2>
          <RatedItemsList
            userId={user.id}
            username={name}
            kind="album"
            isOwnProfile={isOwnProfile}
          />
        </section>
      );

    case 'songs':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Canciones calificadas</h2>
          <RatedItemsList
            userId={user.id}
            username={name}
            kind="song"
            isOwnProfile={isOwnProfile}
          />
        </section>
      );

    case 'contributions':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Aportes al catálogo</h2>

          {/* Cada entidad aporta su propia lista desde su feature, y las tres
              siguen el mismo criterio: en el perfil propio se ven también los
              pendientes y los rechazados, y en el de otro usuario solo lo ya
              aprobado.

              OJO, no confundir con las pestañas "Álbumes" y "Canciones" de más
              arriba: esas son las CALIFICADAS (dependen de las reseñas), no las
              aportadas al catálogo. */}
          <SegmentedControl
            options={CONTRIBUTION_KINDS}
            value={contributionKind}
            // Va envuelto y no como `setContributionKind` a secas: el tipo que
            // espera un setter de useState admite también una función, y con eso
            // TypeScript no logra deducir cuál es el tipo de las opciones.
            onChange={(kind) => setContributionKind(kind)}
            ariaLabel="Tipo de aporte al catálogo"
          />

          {contributionKind === 'artists' ? (
            <ArtistContributionsList
              userId={user.id}
              username={name}
              isOwnProfile={isOwnProfile}
            />
          ) : contributionKind === 'albums' ? (
            <AlbumContributionsList userId={user.id} username={name} isOwnProfile={isOwnProfile} />
          ) : (
            <SongContributionsList userId={user.id} username={name} isOwnProfile={isOwnProfile} />
          )}
        </section>
      );

    case 'membership':
      // La pestaña solo está visible en el perfil propio (ver ProfileTabs), y el
      // panel pide sus datos a las rutas "mine" de la API.
      return <MembershipPanel />;
  }
};
