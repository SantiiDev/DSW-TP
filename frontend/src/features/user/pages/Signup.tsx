// Página de registro de nuevos usuarios con el formulario de creación de cuenta.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../../core/components/Navbar';
import '../styles/_auth.scss';

export const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Previene el envío del formulario (sin backend por ahora)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Navbar />
      <section className="auth">
        <div className="auth__background"></div>

        <div className="auth__card">
            {/* Encabezado */}
            <div className="auth__header">
              <img
                src="/images/logo-musicboxd.png"
                alt="Musicboxd"
                className="auth__logo"
              />
              <h1 className="auth__title">Crear Cuenta</h1>
              <p className="auth__subtitle">
                Únete a la comunidad de Musicboxd
              </p>
            </div>

            {/* Botón de Google */}
            <button type="button" className="auth__google-btn">
              <svg className="auth__google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>

            {/* Separador */}
            <div className="auth__divider">
              <span className="auth__divider-line"></span>
              <span className="auth__divider-text">o</span>
              <span className="auth__divider-line"></span>
            </div>

            {/* Formulario de registro */}
            <form className="auth__form" onSubmit={handleSubmit}>
              <div className="auth__field">
                <label htmlFor="signup-username" className="auth__label">
                  Nombre de usuario
                </label>
                <input
                  id="signup-username"
                  type="text"
                  className="auth__input"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="auth__field">
                <label htmlFor="signup-email" className="auth__label">
                  Correo electrónico
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="auth__input"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth__field">
                <label htmlFor="signup-password" className="auth__label">
                  Contraseña
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className="auth__input"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth__field">
                <label htmlFor="signup-confirm-password" className="auth__label">
                  Confirmar contraseña
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  className="auth__input"
                  placeholder="Repetí tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth__submit-btn">
                Crear Cuenta
              </button>
            </form>

            {/* Link a login */}
            <p className="auth__footer">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="auth__link">
                Inicia sesión
              </Link>
            </p>
          </div>
        </section>
    </>
  );
};
