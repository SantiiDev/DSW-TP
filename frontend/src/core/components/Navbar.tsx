// Barra de navegación principal que provee enlaces a las secciones del sitio y opciones de usuario.
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import './_navbar.scss';

export const Navbar = () => {
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
          <Link to="/music" className="navbar__link">Música</Link>
          <Link to="/members" className="navbar__link">Miembros</Link>
          <Link to="/lists" className="navbar__link">Listas</Link>
          <Link to="/pro" className="navbar__link navbar__link--pro">Pro</Link>
        </div>

        {/* Right side: Auth buttons */}
        <div className="navbar__right">
          <Link to="/login" className="navbar__btn navbar__btn--login">Iniciar Sesión</Link>
          <Link to="/signup" className="navbar__btn navbar__btn--signup">Registrarse</Link>
        </div>
      </div>
    </nav>
  );
};
