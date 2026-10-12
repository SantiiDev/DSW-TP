// Componente de UI para el modal de autenticación (AuthModal).
// Consume el AuthModalContext para controlar su visibilidad y el AuthContext para
// registrar o iniciar sesión contra el backend. Renderiza condicionalmente el
// formulario de Iniciar Sesión o el de Registro.
//
// Valida los campos con reglas propias (core/utils/validators) y no con las del
// navegador: el formulario lleva noValidate y cada campo muestra su mensaje debajo.
import { useState } from 'react';
import { Button } from '../../../../core/components/Button';
import { useAuthModal } from '../../../../core/context/AuthModalContext';
import { useAuth } from '../../../../core/context/AuthContext';
import { hasErrors } from '../../../../core/utils/validators';
import type { FieldErrors } from '../../../../core/utils/validators';
import { validateAuthForm } from '../../models/authRules';
import type { AuthFieldName } from '../../models/authRules';
import { AuthField } from './AuthField';
import './AuthModal.scss';

export const AuthModal = () => {
  const { state: modalState, closeModal, switchView } = useAuthModal();
  const { state: authState, login, register, clearError } = useAuth();

  // Estados para los formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Si ya se intentó enviar. Hasta ese momento no se marca ningún campo: nadie
  // quiere ver "Ingresá tu email" en rojo antes de haber empezado a escribir.
  // Después del primer intento los errores se recalculan en cada tecla, así el
  // mensaje desaparece apenas el campo queda bien.
  const [wasSubmitted, setWasSubmitted] = useState(false);

  if (!modalState.isOpen) return null;

  const isLogin = modalState.view === 'login';

  const errors: FieldErrors<AuthFieldName> = wasSubmitted
    ? validateAuthForm({ username, email, password, confirmPassword }, isLogin)
    : {};

  // Deja el modal como recién abierto, para que al volver a entrar no aparezcan
  // los datos ni el error del intento anterior.
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
    setWasSubmitted(false);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    // Se valida acá con los valores actuales y no con `errors`, que en el primer
    // intento todavía está vacío (wasSubmitted recién se actualiza en el próximo render).
    const currentErrors = validateAuthForm(
      { username, email, password, confirmPassword },
      isLogin
    );
    if (hasErrors(currentErrors)) return;

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
    // El otro formulario pide otros campos: sus errores arrancan de cero.
    setWasSubmitted(false);
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

            {/* Formulario. noValidate apaga los globos del navegador: los
                mensajes los pone el propio formulario debajo de cada campo. */}
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              {/* Error de la API (credenciales incorrectas, email ya usado):
                  es del formulario entero, no de un campo. */}
              {authState.error && (
                <p className="auth__error" role="alert">
                  {authState.error}
                </p>
              )}

              {!isLogin && (
                <AuthField
                  id="auth-username"
                  label="Nombre de usuario"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  autoComplete="username"
                  value={username}
                  error={errors.username}
                  onChange={setUsername}
                />
              )}

              <AuthField
                id="auth-email"
                label="Correo electrónico"
                type="text"
                inputMode="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                value={email}
                error={errors.email}
                onChange={setEmail}
              />

              <AuthField
                id="auth-password"
                label="Contraseña"
                type="password"
                placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                error={errors.password}
                onChange={setPassword}
              />

              {!isLogin && (
                <AuthField
                  id="auth-confirm-password"
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  value={confirmPassword}
                  error={errors.confirmPassword}
                  onChange={setConfirmPassword}
                />
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                className="auth__submit-btn"
                disabled={authState.isSubmitting}
              >
                {authState.isSubmitting
                  ? 'Enviando...'
                  : isLogin
                    ? 'Iniciar Sesión'
                    : 'Crear Cuenta'}
              </Button>
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
