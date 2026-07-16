import { createContext, useReducer, useContext, ReactNode } from 'react';

// Tipos de estado y acciones
type AuthView = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  view: AuthView;
}

type AuthModalAction =
  | { type: 'OPEN_MODAL'; payload: AuthView }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SWITCH_VIEW'; payload: AuthView };

// Estado inicial
const initialState: AuthModalState = {
  isOpen: false,
  view: 'login',
};

// Reducer
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
interface AuthModalContextProps {
  state: AuthModalState;
  openLogin: () => void;
  openSignup: () => void;
  closeModal: () => void;
  switchView: (view: AuthView) => void;
}

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
export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal debe ser usado dentro de un AuthModalProvider');
  }
  return context;
};
