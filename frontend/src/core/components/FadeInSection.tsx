// Componente envoltorio que aplica una animación de aparición (fade in) a su contenido al hacer scroll.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type FadeInSectionProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export const FadeInSection = ({ children, delay = 0, className = '' }: FadeInSectionProps) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            // Si queremos que solo se anime una vez, descomentamos la siguiente línea:
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      ref={domRef}
    >
      {children}
    </div>
  );
};
