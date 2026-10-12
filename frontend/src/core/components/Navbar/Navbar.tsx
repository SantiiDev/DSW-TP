// Barra de navegación principal que provee enlaces a las secciones del sitio y opciones de usuario.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../../../features/user/components/RoleBadge';
import { Avatar } from '../Avatar';
import { ConfirmDialog } from '../Modal';
import { NavbarSearch } from '../NavbarSearch';
import './Navbar.scss';

// Secciones principales del sitio. Se dibujan dos veces: en el centro de la barra
// (escritorio) y en el menú desplegable de mobile, así que se definen una sola vez.
const NAV_LINKS = [
  { to: '/music', label: 'Música', isPro: false },
  { to: '/reviews', label: 'Reseñas', isPro: false },
  { to: '/lists', label: 'Listas', isPro: false },
  { to: '/pro', label: 'Pro', isPro: true },
];

// Arma la clase de un link de navegación según si es Pro y si es la página actual.
const navLinkClass = (isPro: boolean, isActive: boolean) =>
  `navbar__link ${isPro ? 'navbar__link--pro' : ''} ${isActive ? 'active' : ''}`;

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
  // Menú de navegación de mobile (el botón de las tres rayas). En pantallas chicas
  // los links del centro no entran en la barra, así que se muestran acá.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // El menú de mobile también se cierra con Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Se llama al elegir cualquier opción del menú de mobile, para que la página
  // nueva no quede tapada por el menú.
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Los botones de invitado del menú de mobile abren el modal de login o de
  // registro; antes se cierra el menú para no dejar las dos capas abiertas.
  const handleMobileLoginClick = () => {
    closeMobileMenu();
    openLogin();
  };

  const handleMobileSignupClick = () => {
    closeMobileMenu();
    openSignup();
  };

  // Abrir el menú de usuario cierra el de mobile, y al revés: son dos
  // desplegables que salen del mismo lugar y no tienen que verse a la vez.
  const handleUserMenuClick = () => {
    closeMobileMenu();
    setIsMenuOpen((open) => !open);
  };

  const handleMobileMenuToggle = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen((open) => !open);
  };

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
          {/* Busca álbumes, canciones y usuarios. Tiene su propio componente
              porque maneja estado, pedidos a la API y teclado. */}
          <NavbarSearch />
        </div>

        {/* Center: Navigation Links */}
        <div className="navbar__center">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(link.isPro, isActive)}>
              {link.label}
            </NavLink>
          ))}
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
                <Link to="/admin" className="navbar__btn navbar__btn--admin navbar__desktop-only">Admin</Link>
              )}

              <div className="navbar__menu" ref={menuRef}>
                <button
                  type="button"
                  className="navbar__user"
                  onClick={handleUserMenuClick}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menú de usuario"
                >
                  <Avatar url={authState.user.urlAvatar} username={authState.user.username} size="sm" />
                  <span className="navbar__username">{authState.user.username}</span>
                  {/* Se esconde en mobile junto con el nombre: sin nombre al lado,
                      una pastilla suelta al lado del avatar no se entiende. */}
                  <span className="navbar__role">
                    <RoleBadge rol={authState.user.rol} accent={authState.user.visibleColor} />
                  </span>
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
                      <span className="navbar__dropdown-identity">
                        <span className="navbar__dropdown-name">{authState.user.username}</span>
                        <RoleBadge rol={authState.user.rol} accent={authState.user.visibleColor} />
                      </span>
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
              <button onClick={openLogin} className="navbar__btn navbar__btn--login navbar__desktop-only">Iniciar Sesión</button>
              <button onClick={openSignup} className="navbar__btn navbar__btn--signup navbar__desktop-only">Registrarse</button>
            </>
          )}

          {/* Solo en mobile: abre el menú con las secciones del sitio. */}
          <button
            type="button"
            className="navbar__toggle"
            onClick={handleMobileMenuToggle}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-mobile-menu"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú de mobile y tablet: las secciones del sitio y, según la sesión,
          el acceso al panel de admin o los botones para entrar. Desde LG
          (1024px) no se usa: recién ahí los links entran en la barra. */}
      {isMobileMenuOpen && (
        <>
          <div className="navbar__backdrop" onClick={closeMobileMenu} aria-hidden="true" />
          <div className="navbar__mobile-menu" id="navbar-mobile-menu">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => navLinkClass(link.isPro, isActive)}
                onClick={closeMobileMenu}
              >
                {link.label}
              </NavLink>
            ))}

            {authState.status === 'authenticated' && authState.user ? (
              authState.user.isAdmin && (
                <Link to="/admin" className="navbar__btn navbar__btn--admin" onClick={closeMobileMenu}>
                  Panel de administración
                </Link>
              )
            ) : (
              <div className="navbar__mobile-auth">
                <button onClick={handleMobileLoginClick} className="navbar__btn navbar__btn--login">Iniciar Sesión</button>
                <button onClick={handleMobileSignupClick} className="navbar__btn navbar__btn--signup">Registrarse</button>
              </div>
            )}
          </div>
        </>
      )}

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
