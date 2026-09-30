// Barra de pestañas del perfil.
//
// El dibujo de la barra lo hace el componente compartido core/components/Tabs, y
// la regla de qué pestaña se muestra en cada perfil vive en models/profileTabs:
// acá solo se juntan las dos cosas.
import { Tabs } from '../../../../core/components/Tabs';
import { getVisibleTabItems } from '../../models/profileTabs';
import type { ProfileTab } from '../../models/profileTabs';
import type { User } from '../../models/User';

type ProfileTabsProps = {
  user: User;
  isOwnProfile: boolean;
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

export const ProfileTabs = ({ user, isOwnProfile, activeTab, onChange }: ProfileTabsProps) => {
  return (
    <Tabs
      items={getVisibleTabItems(user, isOwnProfile)}
      activeId={activeTab}
      // Tabs trabaja con ids genéricos (string); acá se vuelve al tipo propio de
      // esta barra, que es el que espera la página.
      onChange={(id) => onChange(id as ProfileTab)}
      ariaLabel="Secciones del perfil"
    />
  );
};
