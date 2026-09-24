// Panel de administración (/admin).
//
// Reúne las áreas que gestiona un ADMIN en pestañas, con la misma barra que usa
// el perfil (core/components/Tabs):
//
//   Métricas     -> ventas de la membresía y usuarios por plan (la que abre)
//   Usuarios     -> CRUD de cuentas y cambio de rol
//   Música       -> ABM del catálogo (artistas, álbumes y canciones)
//   Solicitudes  -> moderación de los aportes que mandan los usuarios Pro
//   Planes       -> ABM de los planes de membresía
//
// La página no sabe nada del contenido de cada pestaña: solo decide cuál está
// activa. Cada panel se encarga de sus propios datos, así que abrir el panel no
// dispara las requests de todas las áreas a la vez.
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
import { PlanAdminSection } from '../../membership/components/PlanAdminSection';
import { RevenueAdminSection } from '../../membership/components/RevenueAdminSection';
import '../styles/_admin.scss';

// Métricas va primera y es la que abre: es el resumen de cómo anda el sitio, lo
// primero que un admin quiere ver antes de ponerse a gestionar.
const ADMIN_TABS = [
  { id: 'metrics', label: 'Métricas' },
  { id: 'users', label: 'Usuarios' },
  { id: 'music', label: 'Música' },
  { id: 'requests', label: 'Solicitudes' },
  { id: 'plans', label: 'Planes' },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]['id'];

/** Texto de apoyo de la cabecera, distinto según la pestaña abierta. */
const TAB_SUBTITLES: Record<AdminTab, string> = {
  metrics: 'Cuánto se vendió de la membresía Pro y cómo se reparten los usuarios.',
  users: 'Dar de alta cuentas, cambiar roles y suspender usuarios de Musicboxd.',
  music: 'Mantener el catálogo: artistas, álbumes y canciones.',
  requests: 'Revisar los aportes al catálogo que envían los usuarios Pro.',
  plans: 'Definir los planes de membresía: nombre, precio y qué incluye cada uno.',
};

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('metrics');

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

        {activeTab === 'metrics' && <RevenueAdminSection />}
        {activeTab === 'users' && <AdminUsersPanel />}
        {activeTab === 'music' && <AdminMusicPanel />}
        {activeTab === 'requests' && <AdminRequestsPanel />}
        {activeTab === 'plans' && <PlanAdminSection />}
      </main>
      <Footer />
    </>
  );
};
