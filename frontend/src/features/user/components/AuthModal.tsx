// Componente de UI para el modal de autenticación (AuthModal).
// Consume el AuthModalContext para controlar su visibilidad y el AuthContext para
// registrar o iniciar sesión contra el backend. Renderiza condicionalmente el
// formulario de Iniciar Sesión o el de Registro.
import { useState } from 'react';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { useAuth } from '../../../core/context/AuthContext';
import '../styles/_auth.scss';

export const AuthModal = () => {
  const { state: modalState, closeModal, switchView } = useAuthModal();
  const { state: authState, login, register, clearError } = useAuth();

  // Estados para los formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Errores que se detectan en el navegador y ni siquiera llegan al backend
  // (por ahora, solo que las dos contraseñas no coincidan).
  const [formError, setFormError] = useState<string | null>(null);

  if (!modalState.isOpen) return null;

  const isLogin = modalState.view === 'login';

  // Se muestra un error por vez: el local tiene prioridad porque es el más
  // inmediato a lo que el usuario acaba de escribir.
  const errorMessage = formError ?? authState.error;

  // Deja el modal como recién abierto, para que al volver a entrar no aparezcan
  // los datos ni el error del intento anterior.
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isLogin && password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    const succeeded = isLogin
      ? await login({ email, password })
      : await register({ username, email, password });

    // Si falló, el modal queda abierto mostrando el error que dejó el AuthContext.
    if (succeeded) {
      resetForm();
      closeModal();
    }
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSwitchView = () => {
    setFormError(null);
    clearError();
    switchView(isLogin ? 'signup' : 'login');
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-content">
        <section className="auth">
          <div className="auth__card" onClick={(e) => e.stopPropagation()}>
            <button className="auth__close-btn" onClick={handleClose} aria-label="Cerrar modal">
              ✕
            </button>

            {/* Encabezado */}
            <div className="auth__header">
              <img
                src="/images/logo-musicboxd.png"
                alt="Musicboxd"
                className="auth__logo"
              />
              <h1 className="auth__title">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
              <p className="auth__subtitle">
                {isLogin ? 'Bienvenido de nuevo a Musicboxd' : 'Únete a la comunidad de Musicboxd'}
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

            {/* Formulario */}
            <form className="auth__form" onSubmit={handleSubmit}>
              {errorMessage && (
                <p className="auth__error" role="alert">
                  {errorMessage}
                </p>
              )}

              {!isLogin && (
                <div className="auth__field">
                  <label htmlFor="auth-username" className="auth__label">
                    Nombre de usuario
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    className="auth__input"
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>
              )}

              <div className="auth__field">
                <label htmlFor="auth-email" className="auth__label">
                  Correo electrónico
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth__input"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth__field">
                <label htmlFor="auth-password" className="auth__label">
                  Contraseña
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="auth__input"
                  placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // El mínimo se valida igual en el backend; acá es solo para
                  // avisar antes de gastar una request.
                  minLength={isLogin ? undefined : 8}
                  required
                />
              </div>

              {!isLogin && (
                <div className="auth__field">
                  <label htmlFor="auth-confirm-password" className="auth__label">
                    Confirmar contraseña
                  </label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    className="auth__input"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button type="submit" className="auth__submit-btn" disabled={authState.isSubmitting}>
                {authState.isSubmitting
                  ? 'Enviando...'
                  : isLogin
                    ? 'Iniciar Sesión'
                    : 'Crear Cuenta'}
              </button>
            </form>

            {/* Footer con toggle de vista */}
            <p className="auth__footer">
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                className="auth__link-btn"
                onClick={handleSwitchView}
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
