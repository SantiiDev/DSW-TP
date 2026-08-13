// Contexto global de la sesión del usuario (AuthContext) y su reducer.
//
// Es la única fuente de verdad de "quién está logueado" en todo el frontend:
// el Navbar, el modal de login y ProtectedRoute leen de acá en vez de manejar
// cada uno su propio estado.
//
// Se usa useReducer y no useState porque un login son varios cambios de estado
// coordinados (empieza a cargar, se limpia el error, entra el usuario y su token):
// con un reducer cada transición queda escrita en un solo lugar y es imposible
// dejar el estado a medias, por ejemplo con un usuario cargado y isSubmitting en true.
import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../features/user/models/User';
import { authService } from '../../features/user/services/authService';
import type { AuthSession, LoginInput, RegisterInput } from '../../features/user/services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * - checking:       arrancó la app y todavía se está validando el token guardado.
 * - authenticated:  hay sesión activa.
 * - guest:          no hay sesión (nunca la hubo, expiró o cerró sesión).
 */
type AuthStatus = 'checking' | 'authenticated' | 'guest';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  // Hay un login o un registro en curso: sirve para deshabilitar el formulario.
  isSubmitting: boolean;
  // Mensaje del último intento fallido, ya listo para mostrar en pantalla.
  error: string | null;
};

type AuthAction =
  | { type: 'SESSION_RESTORED'; payload: AuthSession }
  | { type: 'SESSION_EMPTY' }
  | { type: 'AUTH_STARTED' }
  | { type: 'AUTH_SUCCEEDED'; payload: AuthSession }
  | { type: 'AUTH_FAILED'; payload: string }
  | { type: 'LOGGED_OUT' }
  | { type: 'ERROR_CLEARED' };

// Se arranca en 'checking' y no en 'guest' para que la UI no llegue a mostrar
// "Iniciar sesión" un instante antes de darse cuenta de que la sesión seguía viva.
const initialState: AuthState = {
  status: 'checking',
  user: null,
  token: null,
  isSubmitting: false,
  error: null,
};

/**
 * Calcula el nuevo estado de la sesión a partir de una acción.
 * @param state estado actual.
 * @param action acción despachada.
 * @returns el estado resultante.
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SESSION_RESTORED':
    case 'AUTH_SUCCEEDED':
      return {
        status: 'authenticated',
        user: action.payload.user,
        token: action.payload.token,
        isSubmitting: false,
        error: null,
      };

    case 'SESSION_EMPTY':
    case 'LOGGED_OUT':
      return { ...initialState, status: 'guest' };

    case 'AUTH_STARTED':
      // Se limpia el error anterior para que no queden dos mensajes conviviendo.
      return { ...state, isSubmitting: true, error: null };

    case 'AUTH_FAILED':
      return { ...state, status: 'guest', isSubmitting: false, error: action.payload };

    case 'ERROR_CLEARED':
      return { ...state, error: null };

    default:
      return state;
  }
};

type AuthContextProps = {
  state: AuthState;
  /** Inicia sesión. Devuelve true si salió bien, para que el formulario pueda cerrarse. */
  login: (input: LoginInput) => Promise<boolean>;
  /** Registra una cuenta nueva y la deja logueada. Devuelve true si salió bien. */
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Al abrir la app se intenta recuperar la sesión guardada en el navegador.
  //
  // No alcanza con confiar en lo que haya en localStorage: se le pide el usuario
  // al backend, que es quien puede decir si el token sigue vigente y cuál es el
  // rol actualizado (por ejemplo, si pasó de FREE a PRO desde otro dispositivo).
  useEffect(() => {
    const token = tokenStorage.get();

    if (!token) {
      dispatch({ type: 'SESSION_EMPTY' });
      return;
    }

    // Si el componente se desmonta antes de que conteste el backend, no se
    // despacha nada: evita el warning de actualizar un componente desmontado.
    let cancelled = false;

    authService
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) dispatch({ type: 'SESSION_RESTORED', payload: { user, token } });
      })
      .catch(() => {
        // El token venció o ya no sirve: se lo borra para no reintentar en cada carga.
        if (!cancelled) {
          tokenStorage.clear();
          dispatch({ type: 'SESSION_EMPTY' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Login y registro comparten exactamente el mismo ciclo (empezar, guardar el
  // token, o fallar con un mensaje), así que se escribe una sola vez.
  const runAuthRequest = async (request: () => Promise<AuthSession>): Promise<boolean> => {
    dispatch({ type: 'AUTH_STARTED' });

    try {
      const session = await request();
      tokenStorage.save(session.token);
      dispatch({ type: 'AUTH_SUCCEEDED', payload: session });
      return true;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILED', payload: getErrorMessage(error) });
      return false;
    }
  };

  const login = (input: LoginInput) => runAuthRequest(() => authService.login(input));

  const register = (input: RegisterInput) => runAuthRequest(() => authService.register(input));

  // La sesión es solo el token: alcanza con borrarlo del navegador. No hace falta
  // avisarle al backend porque un JWT no se guarda del lado del servidor.
  const logout = () => {
    tokenStorage.clear();
    dispatch({ type: 'LOGGED_OUT' });
  };

  const clearError = () => dispatch({ type: 'ERROR_CLEARED' });

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir el contexto sin repetir el useContext ni el chequeo.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export type { AuthState, AuthStatus };
