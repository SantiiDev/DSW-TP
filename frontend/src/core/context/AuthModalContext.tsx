// Contexto global (AuthModalContext) y reducer asociado.
// Administra el estado de visibilidad y el modo (login o signup) del modal de autenticación
// de forma centralizada, permitiendo que cualquier componente abra o cierre el modal 
// sin necesidad de prop-drilling.
import { createContext, useReducer, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Tipos de estado y acciones
type AuthView = 'login' | 'signup';

type AuthModalState = {
  isOpen: boolean;
  view: AuthView;
};

type AuthModalAction =
  | { type: 'OPEN_MODAL'; payload: AuthView }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SWITCH_VIEW'; payload: AuthView };

// Estado inicial
const initialState: AuthModalState = {
  isOpen: false,
  view: 'login',
};

/**
 * Reducer para gestionar el estado del modal de autenticación.
 * @param {AuthModalState} state - Estado actual del modal.
 * @param {AuthModalAction} action - Acción disparada para modificar el estado.
 * @returns {AuthModalState} El nuevo estado calculado.
 */
const authModalReducer = (state: AuthModalState, action: AuthModalAction): AuthModalState => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, isOpen: true, view: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, isOpen: false };
    case 'SWITCH_VIEW':
      return { ...state, view: action.payload };
    default:
      return state;
  }
};

// Contexto
type AuthModalContextProps = {
  state: AuthModalState;
  openLogin: () => void;
  openSignup: () => void;
  closeModal: () => void;
  switchView: (view: AuthView) => void;
};

const AuthModalContext = createContext<AuthModalContextProps | undefined>(undefined);

// Provider
export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authModalReducer, initialState);

  // El modal necesita saber si hay sesión iniciada. Muchos componentes del landing
  // (cards de álbumes, listas, "ver todo") llaman a openSignup como invitación a
  // registrarse; a un usuario que ya entró eso no tiene sentido mostrárselo.
  // Se corta acá, en un solo lugar, en vez de repetir el chequeo en cada botón.
  const { state: authState } = useAuth();
  const isAuthenticated = authState.status === 'authenticated';

  // Red de seguridad: si la sesión se abre mientras el modal está en pantalla
  // (o se restaura al recargar), el modal se cierra solo.
  useEffect(() => {
    if (isAuthenticated && state.isOpen) dispatch({ type: 'CLOSE_MODAL' });
  }, [isAuthenticated, state.isOpen]);

  const openLogin = () => {
    if (!isAuthenticated) dispatch({ type: 'OPEN_MODAL', payload: 'login' });
  };

  const openSignup = () => {
    if (!isAuthenticated) dispatch({ type: 'OPEN_MODAL', payload: 'signup' });
  };
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });
  const switchView = (view: AuthView) => dispatch({ type: 'SWITCH_VIEW', payload: view });

  return (
    <AuthModalContext.Provider value={{ state, openLogin, openSignup, closeModal, switchView }}>
      {children}
    </AuthModalContext.Provider>
  );
};

// Custom hook para consumir el contexto fácilmente
// eslint-disable-next-line react-refresh/only-export-components
export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal debe ser usado dentro de un AuthModalProvider');
  }
  return context;
};
