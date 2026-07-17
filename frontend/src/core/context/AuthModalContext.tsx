// Contexto global (AuthModalContext) y reducer asociado.
// Administra el estado de visibilidad y el modo (login o signup) del modal de autenticación
// de forma centralizada, permitiendo que cualquier componente abra o cierre el modal 
// sin necesidad de prop-drilling.
import { createContext, useReducer, useContext } from 'react';
import type { ReactNode } from 'react';

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

  const openLogin = () => dispatch({ type: 'OPEN_MODAL', payload: 'login' });
  const openSignup = () => dispatch({ type: 'OPEN_MODAL', payload: 'signup' });
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
