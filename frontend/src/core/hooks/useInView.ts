// Hook que avisa cuándo un elemento entra en pantalla por primera vez.
//
// Lo usan los gráficos para arrancar su animación recién cuando el usuario llega
// a verlos: si se animaran al montar, los que están abajo de todo terminarían de
// dibujarse antes de que alguien haga scroll hasta ellos. Es el mismo mecanismo
// que usa FadeInSection, sacado a un hook para no repetirlo en cada gráfico.
import { useEffect, useRef, useState } from 'react';

/**
 * @param threshold qué fracción del elemento tiene que verse para contar como visible.
 * @returns la ref para colgar del elemento y si ya se vio alguna vez.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          // Una sola vez: el gráfico no se vuelve a animar al salir y entrar.
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
