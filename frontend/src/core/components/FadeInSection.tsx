// Componente envoltorio que aplica una animación de aparición (fade in) a su contenido al hacer scroll.
import type { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

type FadeInSectionProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export const FadeInSection = ({ children, delay = 0, className = '' }: FadeInSectionProps) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className={`fade-in-section ${inView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
