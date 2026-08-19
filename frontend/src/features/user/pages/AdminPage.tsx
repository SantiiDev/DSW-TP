// Panel de administración (/admin).
//
// Reúne las tres áreas que gestiona un ADMIN en pestañas, con la misma barra que
// usa el perfil (core/components/Tabs):
//
//   Usuarios     -> CRUD de cuentas y cambio de rol
//   Música       -> ABM del catálogo (artistas, álbumes y canciones)
//   Solicitudes  -> moderación de los aportes que mandan los usuarios Pro
//
// La página no sabe nada del contenido de cada pestaña: solo decide cuál está
// activa. Cada panel se encarga de sus propios datos, así que abrir el panel no
// dispara las requests de las tres áreas a la vez.
//
// Ruta protegida con roles={['ADMIN']}, pero la validación real es la del backend:
// todos estos endpoints exigen rol ADMIN aunque alguien fuerce la URL.
import { useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Tabs } from '../../../core/components/Tabs';
import { AdminUsersPanel } from '../components/AdminUsersPanel';
import { AdminMusicPanel } from '../components/AdminMusicPanel';
import { AdminRequestsPanel } from '../components/AdminRequestsPanel';
import '../styles/_admin.scss';

const ADMIN_TABS = [
  { id: 'users', label: 'Usuarios' },
  { id: 'music', label: 'Música' },
  { id: 'requests', label: 'Solicitudes' },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]['id'];

/** Texto de apoyo de la cabecera, distinto según la pestaña abierta. */
const TAB_SUBTITLES: Record<AdminTab, string> = {
  users: 'Dar de alta cuentas, cambiar roles y eliminar usuarios de Musicboxd.',
  music: 'Mantener el catálogo: artistas, álbumes y canciones.',
  requests: 'Revisar los aportes al catálogo que envían los usuarios Pro.',
};

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <>
      <Navbar />
      <main className="admin-users">
        <header className="admin-users__header">
          <h1 className="admin-users__title">Panel de administración</h1>
          <p className="admin-users__subtitle">{TAB_SUBTITLES[activeTab]}</p>
        </header>

        <Tabs
          items={ADMIN_TABS.map(({ id, label }) => ({ id, label }))}
          activeId={activeTab}
          // Tabs trabaja con ids genéricos (string); acá se vuelve al tipo propio
          // de esta barra.
          onChange={(id) => setActiveTab(id as AdminTab)}
          ariaLabel="Secciones del panel de administración"
        />

        {activeTab === 'users' && <AdminUsersPanel />}
        {activeTab === 'music' && <AdminMusicPanel />}
        {activeTab === 'requests' && <AdminRequestsPanel />}
      </main>
      <Footer />
    </>
  );
};
