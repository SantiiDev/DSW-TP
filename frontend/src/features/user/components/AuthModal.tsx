// Componente de UI para el modal de autenticación (AuthModal).
// Consume el AuthModalContext para controlar su visibilidad y el AuthContext para
// registrar o iniciar sesión contra el backend. Renderiza condicionalmente el
// formulario de Iniciar Sesión o el de Registro.
//
// Valida los campos con reglas propias (core/utils/validators) y no con las del
// navegador: el formulario lleva noValidate y cada campo muestra su mensaje debajo.
import { useState } from 'react';
import { Button } from '../../../core/components/Button';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { useAuth } from '../../../core/context/AuthContext';
import {
  fieldErrorProps,
  hasErrors,
  isEmail,
  matchesPattern,
  maxLength,
  minLength,
  required,
  sameAs,
  validateField,
} from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';
import '../styles/_auth.scss';

type AuthField = 'username' | 'email' | 'password' | 'confirmPassword';

type AuthValues = Record<AuthField, string>;

/**
 * Valida el formulario con las mismas reglas que registerSchema y loginSchema
 * del backend (auth.schema.ts), así el usuario se entera antes de mandarlo.
 *
 * En el login la contraseña solo tiene que estar: ya existe y se compara tal
 * cual, y validarle el largo daría pistas sobre el formato esperado (el backend
 * hace lo mismo).
 *
 * @param values lo que escribió el usuario.
 * @param isLogin si es el formulario de inicio de sesión o el de registro.
 */
function validateAuthForm(values: AuthValues, isLogin: boolean): FieldErrors<AuthField> {
  const email = validateField(values.email, [required('Ingresá tu email.'), isEmail()]);

  if (isLogin) {
    return {
      email,
      password: validateField(values.password, [required('Ingresá tu contraseña.')]),
    };
  }

  return {
    username: validateField(values.username, [
      required('Elegí un nombre de usuario.'),
      minLength(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
      maxLength(50, 'El nombre de usuario no puede tener más de 50 caracteres.'),
      matchesPattern(
        /^[a-zA-Z0-9._]+$/,
        'El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.'
      ),
    ]),
    email,
    password: validateField(values.password, [
      required('Elegí una contraseña.'),
      minLength(8, 'La contraseña debe tener al menos 8 caracteres.'),
      maxLength(72, 'La contraseña no puede tener más de 72 caracteres.'),
    ]),
    confirmPassword: validateField(values.confirmPassword, [
      required('Repetí la contraseña.'),
      sameAs(values.password, 'Las contraseñas no coinciden.'),
    ]),
  };
}

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

  const errors: FieldErrors<AuthField> = wasSubmitted
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
                <div className="auth__field">
                  <label htmlFor="auth-username" className="auth__label">
                    Nombre de usuario
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    className="auth__input"
                    placeholder="Tu nombre de usuario"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    {...fieldErrorProps('auth-username', errors.username)}
                  />
                  <FieldError id="auth-username" message={errors.username} />
                </div>
              )}

              <div className="auth__field">
                <label htmlFor="auth-email" className="auth__label">
                  Correo electrónico
                </label>
                {/* type="text" con inputMode="email" y no type="email": este
                    último trae su propia validación del navegador. inputMode
                    conserva el teclado con "@" en el celular. */}
                <input
                  id="auth-email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  className="auth__input"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  {...fieldErrorProps('auth-email', errors.email)}
                />
                <FieldError id="auth-email" message={errors.email} />
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
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  {...fieldErrorProps('auth-password', errors.password)}
                />
                <FieldError id="auth-password" message={errors.password} />
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
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    {...fieldErrorProps('auth-confirm-password', errors.confirmPassword)}
                  />
                  <FieldError id="auth-confirm-password" message={errors.confirmPassword} />
                </div>
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
