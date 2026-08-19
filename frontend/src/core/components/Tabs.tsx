// Barra de pestañas horizontal, reutilizable por cualquier feature.
//
// La usan el perfil (ProfileTabs) y el panel de administración (AdminPage): en vez
// de repetir el markup y los estilos en cada uno, las dos pantallas comparten este
// componente y por lo tanto se ven exactamente igual.
//
// Es presentacional: no decide qué pestañas existen ni cuál corresponde mostrar,
// solo dibuja las que recibe y avisa cuál se clickeó.
import './_tabs.scss';

/** Una pestaña: el id con el que la identifica el padre y el texto que se ve. */
export type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  /** Id de la pestaña activa. */
  activeId: string;
  onChange: (id: string) => void;
  /** Describe de qué sección son las pestañas, para lectores de pantalla. */
  ariaLabel: string;
};

export const Tabs = ({ items, activeId, onChange, ariaLabel }: TabsProps) => {
  return (
    // El wrapper permite scroll horizontal: en mobile las pestañas no entran.
    <nav className="tabs" aria-label={ariaLabel}>
      <ul className="tabs__list">
        {items.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={`tabs__tab ${activeId === tab.id ? 'tabs__tab--active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-current={activeId === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
