// Contenido de la pestaña activa del perfil.
//
// Las secciones que dependen de features todavía no implementadas (reseñas,
// aportes de catálogo) muestran su estado vacío definitivo. Cuando esos
// endpoints existan, se reemplaza el EmptyState por el listado real sin tocar
// ni la cabecera ni la navegación de pestañas.
import { Link } from 'react-router-dom';
import { Activity, CreditCard, Disc3, Music, PlusCircle, Star } from 'lucide-react';
import { EmptyState } from '../../../core/components/EmptyState';
import { ROLE_LABELS } from '../models/User';
import type { User } from '../models/User';
import type { ProfileTab } from './ProfileTabs';

type ProfileTabContentProps = {
  user: User;
  isOwnProfile: boolean;
  activeTab: ProfileTab;
};

/** Textos del vacío según se mire el perfil propio o el de otro. */
function emptyCopy(isOwnProfile: boolean, own: string, other: string): string {
  return isOwnProfile ? own : other;
}

export const ProfileTabContent = ({ user, isOwnProfile, activeTab }: ProfileTabContentProps) => {
  const name = user.username;

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
                <Link to="/music" className="profile-panel__cta">
                  Explorar música
                </Link>
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
          <EmptyState
            icon={<PlusCircle size={22} />}
            title={emptyCopy(isOwnProfile, 'Todavía no aportaste al catálogo.', `${name} no tiene aportes.`)}
            message={emptyCopy(
              isOwnProfile,
              'Como Pro podés dar de alta artistas, álbumes y canciones. Quedan pendientes hasta que un administrador los aprueba.',
              'Los artistas, álbumes y canciones que aporte van a listarse acá una vez aprobados.'
            )}
          />
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
              <Link to="/pro" className="profile-membership__cta">
                Mejorar mi plan
              </Link>
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
