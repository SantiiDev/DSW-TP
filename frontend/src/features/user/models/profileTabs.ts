// Pestañas del perfil y la regla de cuál se muestra en cada uno.
//
// Cada pestaña corresponde a un CRUD o CUU real del proyecto (ver proposal.md):
//   Resumen    -> actividad reciente
//   Reseñas    -> CRUD Reseña + listado de reseñas del perfil filtrado por estrellas
//   Álbumes    -> álbumes que el usuario calificó
//   Canciones  -> canciones que el usuario calificó
//   Aportes    -> CUU 3, alta de catálogo (solo tiene sentido para PRO/ADMIN)
//   Estadísticas -> CUU 4, "Tu año en música" (privado; bloqueado para FREE)
//   Membresía  -> CUU 2, plan y pagos (privado: solo en el perfil propio)
//
// Vive en models/ y no junto al componente ProfileTabs porque la usan tanto la
// barra como la página del perfil: un archivo de componente que además exporta
// constantes y funciones rompe el recargado en caliente de Vite.
import type { User } from './User';

export const PROFILE_TABS = [
  'resumen',
  'reviews',
  'albums',
  'songs',
  'contributions',
  'stats',
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
    // Aportar catálogo es exclusivo de PRO y ADMIN, así que a un usuario FREE
    // la pestaña le mostraría siempre un vacío que nunca va a poder llenar.
    id: 'contributions',
    label: 'Aportes',
    isVisible: (user) => user.canContributeCatalog,
  },
  {
    // Las estadísticas avanzadas son de cada uno: no se muestran en perfiles
    // ajenos. A un FREE la pestaña SÍ se le muestra, con la vista bloqueada: es
    // la forma de que vea lo que desbloquea Pro.
    id: 'stats',
    label: 'Estadísticas',
    isVisible: (_user, isOwnProfile) => isOwnProfile,
  },
  {
    // El plan y los pagos son datos privados: no se muestran en perfiles ajenos.
    id: 'membership',
    label: 'Membresía',
    isVisible: (_user, isOwnProfile) => isOwnProfile,
  },
];

/**
 * Devuelve las pestañas visibles para un perfil, con su etiqueta. Es lo que
 * dibuja la barra ProfileTabs.
 */
export function getVisibleTabItems(
  user: User,
  isOwnProfile: boolean
): { id: ProfileTab; label: string }[] {
  return TAB_DEFINITIONS.filter((tab) => tab.isVisible(user, isOwnProfile)).map(
    ({ id, label }) => ({ id, label })
  );
}

/**
 * Devuelve solo los ids de las pestañas visibles para un perfil. La usa la página
 * para no quedarse en una pestaña que dejó de existir (por ejemplo, "Membresía" al
 * pasar del perfil propio al de otro usuario).
 */
export function getVisibleTabs(user: User, isOwnProfile: boolean): ProfileTab[] {
  return getVisibleTabItems(user, isOwnProfile).map((tab) => tab.id);
}
