// Barra de pestañas del perfil.
//
// Cada pestaña corresponde a un CRUD o CUU real del proyecto (ver proposal.md):
//   Resumen    -> actividad reciente
//   Reseñas    -> CRUD Reseña + listado de reseñas del perfil filtrado por estrellas
//   Álbumes    -> álbumes que el usuario calificó
//   Canciones  -> canciones que el usuario calificó
//   Aportes    -> CUU 3, alta de catálogo (solo tiene sentido para PATRON/ADMIN)
//   Membresía  -> CUU 2, plan y pagos (privado: solo en el perfil propio)
import type { User } from '../models/User';

export const PROFILE_TABS = [
  'resumen',
  'reviews',
  'albums',
  'songs',
  'contributions',
  'membership',
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number];

type TabDefinition = {
  id: ProfileTab;
  label: string;
  /**
   * Decide si la pestaña se muestra para este perfil.
   * @param user dueño del perfil que se está viendo.
   * @param isOwnProfile si el que mira es el dueño.
   */
  isVisible: (user: User, isOwnProfile: boolean) => boolean;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  { id: 'resumen', label: 'Resumen', isVisible: () => true },
  { id: 'reviews', label: 'Reseñas', isVisible: () => true },
  { id: 'albums', label: 'Álbumes', isVisible: () => true },
  { id: 'songs', label: 'Canciones', isVisible: () => true },
  {
    // Aportar catálogo es exclusivo de PATRON y ADMIN, así que a un usuario FREE
    // la pestaña le mostraría siempre un vacío que nunca va a poder llenar.
    id: 'contributions',
    label: 'Aportes',
    isVisible: (user) => user.canContributeCatalog,
  },
  {
    // El plan y los pagos son datos privados: no se muestran en perfiles ajenos.
    id: 'membership',
    label: 'Membresía',
    isVisible: (_user, isOwnProfile) => isOwnProfile,
  },
];

type ProfileTabsProps = {
  user: User;
  isOwnProfile: boolean;
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

export const ProfileTabs = ({ user, isOwnProfile, activeTab, onChange }: ProfileTabsProps) => {
  const visibleTabs = TAB_DEFINITIONS.filter((tab) => tab.isVisible(user, isOwnProfile));

  return (
    // El wrapper permite scroll horizontal: en mobile las seis pestañas no entran.
    <nav className="profile-tabs" aria-label="Secciones del perfil">
      <ul className="profile-tabs__list">
        {visibleTabs.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={`profile-tabs__tab ${activeTab === tab.id ? 'profile-tabs__tab--active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/**
 * Devuelve las pestañas visibles para un perfil. La usa la página para no
 * quedarse en una pestaña que dejó de existir (por ejemplo, "Membresía" al pasar
 * del perfil propio al de otro usuario).
 */
export function getVisibleTabs(user: User, isOwnProfile: boolean): ProfileTab[] {
  return TAB_DEFINITIONS.filter((tab) => tab.isVisible(user, isOwnProfile)).map((tab) => tab.id);
}
