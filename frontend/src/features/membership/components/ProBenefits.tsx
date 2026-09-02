// Grilla de beneficios de la membresía Pro.
//
// La usan las dos caras de la página /pro: la de venta (a un visitante o a un
// usuario Free le explica qué ganaría) y la del socio (a un usuario Pro le
// recuerda qué tiene habilitado). Por eso el encabezado es una prop y el estado
// "activo" se puede prender con `isActive`.
import { Ban, BarChart3, Check, ListMusic, Palette, PlusCircle, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ProBenefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const PRO_BENEFITS: ProBenefit[] = [
  {
    icon: Ban,
    title: 'Sin anuncios, nunca',
    description: 'Navegá Musicboxd sin interrupciones. Una experiencia limpia dedicada 100% a la música.',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas en profundidad',
    description: 'Descubrí patrones de escucha, géneros más reseñados, evolución mensual y tu top de artistas.',
  },
  {
    icon: Palette,
    title: 'Personalización del perfil',
    description: 'Elegí colores, banners y temas exclusivos para que tu perfil refleje tu estilo musical.',
  },
  {
    icon: ListMusic,
    title: 'Listas ilimitadas',
    description: 'Creá todas las listas que quieras. Organizá tu música como un verdadero curador.',
  },
  {
    icon: PlusCircle,
    title: 'Aportá al catálogo',
    description: 'Cargá artistas, álbumes y canciones que falten. Un administrador los revisa y quedan para toda la comunidad.',
  },
  {
    icon: Shield,
    title: 'Badge Pro en tu perfil',
    description: 'Destacá en la comunidad con una insignia verificada en tu perfil y en todas tus reseñas.',
  },
];

type ProBenefitsProps = {
  heading: string;
  /** true en la vista del socio: cada beneficio se marca como ya habilitado. */
  isActive?: boolean;
};

export const ProBenefits = ({ heading, isActive = false }: ProBenefitsProps) => {
  return (
    <section id="features" className="pro-features">
      <h2 className="pro-features__heading">{heading}</h2>
      <div className="pro-features__grid">
        {PRO_BENEFITS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="pro-feature-card">
            <div className="pro-feature-card__top">
              {isActive && (
                <span className="pro-feature-card__badge">
                  <Check size={12} aria-hidden="true" />
                  Activo
                </span>
              )}
              <h3 className="pro-feature-card__title">{title}</h3>
              <p className="pro-feature-card__desc">{description}</p>
            </div>
            <div className="pro-feature-card__visual">
              <Icon size={48} className="pro-feature-card__icon" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
