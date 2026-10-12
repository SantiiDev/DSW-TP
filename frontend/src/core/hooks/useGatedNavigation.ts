// Navegación que pide sesión antes de dejar entrar.
//
// El explorador de música (/music) es público y muestra el catálogo real a
// cualquiera: es el gancho para el que todavía no tiene cuenta. Pero cuando ese
// visitante hace click en un álbum, en una canción o en "Ver todos", en vez de
// navegar se le abre el modal de registro. Con la sesión iniciada, el mismo click
// lleva a donde tiene que llevar.
//
//   const { isAuthenticated, goOrSignup } = useGatedNavigation();
//   <button onClick={() => goOrSignup('/albums?orden=rating')}>Ver todos</button>
//
// Para las tarjetas, que además tienen que ser un <a> de verdad cuando hay
// sesión, está el componente GatedLink, que usa este mismo hook.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';

type UseGatedNavigationResult = {
  /** true si hay sesión iniciada. */
  isAuthenticated: boolean;
  /** Navega a la ruta, o abre el modal de registro si no hay sesión. */
  goOrSignup: (to: string) => void;
};

export function useGatedNavigation(): UseGatedNavigationResult {
  const { state } = useAuth();
  const { openSignup } = useAuthModal();
  const navigate = useNavigate();

  const isAuthenticated = state.status === 'authenticated';

  const goOrSignup = useCallback(
    (to: string) => {
      if (isAuthenticated) navigate(to);
      else openSignup();
    },
    [isAuthenticated, navigate, openSignup]
  );

  return { isAuthenticated, goOrSignup };
}
