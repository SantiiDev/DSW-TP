// Contenido de la pestaña activa del perfil.
//
// Las secciones que dependen de features todavía no implementadas (reseñas,
// álbumes y canciones calificados) muestran su estado vacío definitivo. Cuando
// esos endpoints existan, se reemplaza el EmptyState por el listado real sin
// tocar ni la cabecera ni la navegación de pestañas: es lo que ya se hizo con
// "Aportes", que lista los artistas propuestos por el dueño del perfil.
import { useState } from 'react';
import { Activity, CreditCard, Disc3, Music, Star } from 'lucide-react';
import { ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import type { SegmentOption } from '../../../core/components/SegmentedControl';
import { ROLE_LABELS } from '../models/User';
import type { User } from '../models/User';
import { AlbumContributionsList } from '../../album/components/AlbumContributionsList';
import { ArtistContributionsList } from '../../artist/components/ArtistContributionsList';
import { SongContributionsList } from '../../song/components/SongContributionsList';
import type { ProfileTab } from './ProfileTabs';

type ProfileTabContentProps = {
  user: User;
  isOwnProfile: boolean;
  activeTab: ProfileTab;
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

export const ProfileTabContent = ({ user, isOwnProfile, activeTab }: ProfileTabContentProps) => {
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
          <EmptyState
            icon={<Star size={22} />}
            title={emptyCopy(isOwnProfile, 'No publicaste ninguna reseña.', `${name} no publicó reseñas.`)}
            message="Acá van a listarse las reseñas, con filtro por cantidad de estrellas."
          />
        </section>
      );

    case 'albums':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Álbumes calificados</h2>
          <EmptyState
            icon={<Disc3 size={22} />}
            title={emptyCopy(isOwnProfile, 'No calificaste ningún álbum.', `${name} no calificó álbumes.`)}
            message="Los álbumes que reciban una calificación se van a mostrar en esta grilla."
          />
        </section>
      );

    case 'songs':
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Canciones calificadas</h2>
          <EmptyState
            icon={<Music size={22} />}
            title={emptyCopy(isOwnProfile, 'No calificaste ninguna canción.', `${name} no calificó canciones.`)}
            message="Cada canción de un álbum se puede calificar por separado."
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
      return (
        <section className="profile-panel">
          <h2 className="profile-panel__title">Membresía</h2>

          {/* Este dato sí existe hoy: el rol viene con el usuario. Lo que falta
              es el detalle de la suscripción y los pagos (CUU 2). */}
          <div className="profile-membership">
            <div className="profile-membership__current">
              <span className="profile-membership__label">Tu plan actual</span>
              <span className="profile-membership__plan">{ROLE_LABELS[user.rol]}</span>
            </div>

            {user.rol === 'FREE' ? (
              <ButtonLink to="/pro" size="sm">
                Mejorar mi plan
              </ButtonLink>
            ) : (
              <p className="profile-membership__note">
                <CreditCard size={16} aria-hidden="true" />
                El historial de pagos y la gestión de la suscripción se suman con la pasarela.
              </p>
            )}
          </div>
        </section>
      );
  }
};
