// Barra de navegación principal que provee enlaces a las secciones del sitio y opciones de usuario.
import { Link, NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import './_navbar.scss';

export const Navbar = () => {
  const { openLogin, openSignup } = useAuthModal();

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Left side: Logo & Search */}
        <div className="navbar__left">
          <Link to="/" className="navbar__logo">
            <img src="/images/logo-musicboxd.png" alt="Musicboxd" className="navbar__logo-img" />
          </Link>
          <div className="navbar__search">
            <Search className="navbar__search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Buscar en Musicboxd..." 
              className="navbar__search-input"
            />
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="navbar__center">
          <NavLink to="/music" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Música</NavLink>
          <NavLink to="/members" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Miembros</NavLink>
          <NavLink to="/lists" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Listas</NavLink>
          <NavLink to="/pro" className={({ isActive }) => `navbar__link navbar__link--pro ${isActive ? 'active' : ''}`}>Pro</NavLink>
        </div>

        {/* Right side: Auth buttons */}
        <div className="navbar__right">
          <button onClick={openLogin} className="navbar__btn navbar__btn--login">Iniciar Sesión</button>
          <button onClick={openSignup} className="navbar__btn navbar__btn--signup">Registrarse</button>
        </div>
      </div>
    </nav>
  );
};
