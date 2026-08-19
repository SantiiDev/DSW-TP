// Barra de navegación principal que provee enlaces a las secciones del sitio y opciones de usuario.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { ConfirmDialog } from './Modal';
import './_navbar.scss';

export const Navbar = () => {
  const { openLogin, openSignup } = useAuthModal();
  const { state: authState, logout } = useAuth();
  const navigate = useNavigate();

  // Cerrar sesión pide confirmación: es fácil apretarlo sin querer y perder lo
  // que se estuviera haciendo.
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  // Menú del usuario: la barra solo muestra el avatar, y las acciones de la
  // cuenta (perfil y cerrar sesión) aparecen al desplegarlo.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer click afuera o al apretar Escape, que es lo que
  // espera cualquiera de un desplegable.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
    // Si estaba en una ruta privada (perfil, admin) hay que sacarlo de ahí:
    // ProtectedRoute lo redirigiría igual, pero al inicio y no a donde estaba.
    navigate('/');
  };

  // El diálogo de confirmación se abre desde adentro del menú, así que primero
  // hay que cerrarlo: si no, quedarían las dos capas abiertas a la vez.
  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(true);
  };

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

        {/* Right side: sesión iniciada o botones de auth */}
        {/* Mientras el estado es 'checking' se muestran los botones de invitado:
            es lo correcto en la mayoría de las visitas y evita un parpadeo. */}
        <div className="navbar__right">
          {authState.status === 'authenticated' && authState.user ? (
            <>
              {/* El acceso al panel solo se muestra si el usuario es ADMIN. Es
                  para no ofrecer una pantalla que no va a poder usar: quien
                  corta de verdad es el backend. */}
              {authState.user.isAdmin && (
                <Link to="/admin" className="navbar__btn navbar__btn--admin">Admin</Link>
              )}

              <div className="navbar__menu" ref={menuRef}>
                <button
                  type="button"
                  className="navbar__user"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menú de usuario"
                >
                  <Avatar url={authState.user.urlAvatar} username={authState.user.username} size="sm" />
                  <span className="navbar__username">{authState.user.username}</span>
                  <ChevronDown
                    className={`navbar__chevron ${isMenuOpen ? 'navbar__chevron--open' : ''}`}
                    size={16}
                    aria-hidden="true"
                  />
                </button>

                {isMenuOpen && (
                  <div className="navbar__dropdown" role="menu">
                    {/* El nombre se repite acá porque en mobile no se muestra en la
                        barra: así el usuario siempre sabe con qué cuenta entró. */}
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-name">{authState.user.username}</span>
                      <span className="navbar__dropdown-email">{authState.user.email}</span>
                    </div>

                    <Link
                      to="/profile"
                      className="navbar__dropdown-item"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserRound size={16} aria-hidden="true" />
                      Mi perfil
                    </Link>

                    <button
                      type="button"
                      className="navbar__dropdown-item navbar__dropdown-item--logout"
                      role="menuitem"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={openLogin} className="navbar__btn navbar__btn--login">Iniciar Sesión</button>
              <button onClick={openSignup} className="navbar__btn navbar__btn--signup">Registrarse</button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Cerrar sesión"
        message="¿Seguro que querés cerrar tu sesión en Musicboxd?"
        confirmLabel="Cerrar sesión"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </nav>
  );
};
