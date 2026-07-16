// Página Pro de Musicboxd: muestra los beneficios de la suscripción Pro vs Free, planes de pricing y FAQ.
import { useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import {
  Crown,
  BarChart3,
  Palette,
  Zap,
  Shield,
  Star,
  Check,
  X,
  ChevronDown,
  Ban,
  ListMusic,
  Sparkles,
  HeadphonesIcon,
} from 'lucide-react';
import '../styles/_membership.scss';

// Beneficios que incluye Pro, cada uno con ícono y texto descriptivo
const PRO_BENEFITS = [
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
    icon: Shield,
    title: 'Badge Pro en tu perfil',
    description: 'Destacá en la comunidad con una insignia verificada en tu perfil y en todas tus reseñas.',
  },
  {
    icon: Zap,
    title: 'Acceso anticipado',
    description: 'Probá nuevas funciones antes que nadie y ayudanos a definir el futuro de Musicboxd.',
  },
];

// Filas de la tabla comparativa Free vs Pro
const COMPARISON_ROWS = [
  { feature: 'Sin anuncios en Musicboxd', free: false, pro: true },
  { feature: 'Reseñas y calificaciones', free: true, pro: true },
  { feature: 'Badge Pro en perfil y reseñas', free: false, pro: true },
  { feature: 'Banner personalizado en el perfil', free: false, pro: true },
  { feature: 'Estadísticas avanzadas de escucha', free: false, pro: true },
  { feature: 'Temas de colores para tu perfil', free: false, pro: true },
  { feature: 'Listas (máx. 10)', free: true, proText: 'Ilimitadas' },
  { feature: 'Largo ilimitado en reseñas', free: false, pro: true },
  { feature: 'Acceso anticipado a funciones', free: false, pro: true },
  { feature: 'Soporte prioritario', free: false, pro: true },
];

// Preguntas frecuentes
const FAQ_ITEMS = [
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer: 'Sí, podés cancelar tu suscripción Pro cuando quieras desde la configuración de tu cuenta. Seguirás teniendo acceso hasta que finalice tu período de facturación.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal y MercadoPago.',
  },
  {
    question: '¿Pierdo mis datos si vuelvo a Free?',
    answer: 'No perdés ningún dato. Tus reseñas, calificaciones y listas se mantienen. Solo perderás acceso a las funciones exclusivas de Pro.',
  },
  {
    question: '¿Hay descuento para estudiantes?',
    answer: 'Sí, ofrecemos un 50% de descuento para estudiantes verificados. Contactanos a soporte@musicboxd.com con tu certificado estudiantil.',
  },
];

export const ProPage = () => {
  // Controla qué pregunta del FAQ está expandida (-1 = ninguna)
  const [openFaq, setOpenFaq] = useState(-1);

  // Alterna la visibilidad de una pregunta del FAQ
  const handleToggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  return (
    <>
      <Navbar />
      <main className="pro-page">

        {/* ── Hero: imagen de fondo con título y CTAs ──── */}
        <FadeInSection delay={100}>
          <section className="pro-hero">
            {/* Álbumes flotantes como fondo visual (reutiliza assets existentes) */}
            <div className="pro-hero__bg">
              <img src="/images/abbey-road.jpg" alt="" className="pro-hero__bg-album pro-hero__bg-album--1" />
              <img src="/images/audioslave.jpeg" alt="" className="pro-hero__bg-album pro-hero__bg-album--2" />
              <img src="/images/wish-you-where-here.jpeg" alt="" className="pro-hero__bg-album pro-hero__bg-album--3" />
              <img src="/images/oktubre.jpg" alt="" className="pro-hero__bg-album pro-hero__bg-album--4" />
              <img src="/images/frank-sinatra.webp" alt="" className="pro-hero__bg-album pro-hero__bg-album--5" />
              <img src="/images/ahi-vamos.jpg" alt="" className="pro-hero__bg-album pro-hero__bg-album--6" />
            </div>
            <div className="pro-hero__overlay" />
            <div className="pro-hero__content">
              <h1 className="pro-hero__title">
                Potenciá tu experiencia<br />en Musicboxd con <span className="pro-hero__title-accent">Pro</span>
              </h1>
              <p className="pro-hero__subtitle">
                Planes desde $4.99 / mes. Cancelá cuando quieras.
              </p>
              <div className="pro-hero__actions">
                <a href="#pricing" className="pro-hero__cta pro-hero__cta--primary">
                  <Crown size={18} />
                  Pasarme a Pro
                </a>
                <a href="#features" className="pro-hero__cta pro-hero__cta--secondary">
                  Ver beneficios
                </a>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* ── Pricing Cards: Free vs Pro ────────────── */}
        <FadeInSection delay={200}>
          <section id="pricing" className="pro-pricing">
            <div className="pro-pricing__cards">

              {/* Card Free */}
              <div className="pro-pricing__card">
                <h3 className="pro-pricing__card-name">
                  <HeadphonesIcon size={22} />
                  Musicboxd Free
                </h3>
                <div className="pro-pricing__card-price">
                  <span className="pro-pricing__card-amount">$0</span>
                  <span className="pro-pricing__card-period"> / mes</span>
                </div>
                <p className="pro-pricing__card-tagline">Todo lo esencial, y...</p>
                <ul className="pro-pricing__card-list">
                  <li><Ban size={18} /> Con anuncios</li>
                  <li><Star size={18} /> Reseñas y calificaciones</li>
                  <li><Shield size={18} /> Perfil público</li>
                  <li><ListMusic size={18} /> Hasta 10 listas</li>
                </ul>
                <button className="pro-pricing__card-btn pro-pricing__card-btn--outline">Plan actual</button>
              </div>

              {/* Card Pro — destacada */}
              <div className="pro-pricing__card pro-pricing__card--pro">
                <div className="pro-pricing__card-stickers">
                  <span className="pro-pricing__sticker pro-pricing__sticker--1">🎵</span>
                  <span className="pro-pricing__sticker pro-pricing__sticker--2">🔥</span>
                  <span className="pro-pricing__sticker pro-pricing__sticker--3">⭐</span>
                  <span className="pro-pricing__sticker pro-pricing__sticker--4">🎧</span>
                  <span className="pro-pricing__sticker pro-pricing__sticker--5">💎</span>
                </div>
                <h3 className="pro-pricing__card-name">
                  <Crown size={22} />
                  Musicboxd Pro
                </h3>
                <div className="pro-pricing__card-price">
                  <span className="pro-pricing__card-amount">$4.99</span>
                  <span className="pro-pricing__card-period"> / mes</span>
                </div>
                <p className="pro-pricing__card-tagline">Todo lo de Free, y...</p>
                <ul className="pro-pricing__card-list">
                  <li><Palette size={18} /> Personalización del perfil</li>
                  <li><BarChart3 size={18} /> Estadísticas avanzadas</li>
                  <li><Shield size={18} /> Badge Pro verificado</li>
                  <li><ListMusic size={18} /> Listas ilimitadas</li>
                  <li><Zap size={18} /> Acceso anticipado</li>
                  <li><Sparkles size={18} /> ¡Y mucho más!</li>
                </ul>
                <button className="pro-pricing__card-btn pro-pricing__card-btn--primary">
                  <Crown size={16} />
                  Obtener Pro
                </button>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* ── Features Showcase: qué incluye Pro ───── */}
        <FadeInSection delay={200}>
          <section id="features" className="pro-features">
            <h2 className="pro-features__heading">¿Qué incluye Pro?</h2>
            <div className="pro-features__grid">
              {PRO_BENEFITS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="pro-feature-card">
                  <div className="pro-feature-card__top">
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
        </FadeInSection>

        {/* ── Comparison Table ──────────────────────── */}
        <FadeInSection delay={200}>
          <section className="pro-comparison">
            <h2 className="pro-comparison__heading">Funciones y precios</h2>
            <div className="pro-comparison__table-wrap">
              <table className="pro-comparison__table">
                <thead>
                  <tr>
                    <th className="pro-comparison__th pro-comparison__th--feature"></th>
                    <th className="pro-comparison__th">Free</th>
                    <th className="pro-comparison__th pro-comparison__th--pro">PRO</th>
                  </tr>
                  <tr className="pro-comparison__price-row">
                    <td className="pro-comparison__td pro-comparison__td--feature">Precio</td>
                    <td className="pro-comparison__td">Gratis</td>
                    <td className="pro-comparison__td pro-comparison__td--pro-cell">$4.99 / mes</td>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map(({ feature, free, pro, proText }) => (
                    <tr key={feature} className="pro-comparison__row">
                      <td className="pro-comparison__td pro-comparison__td--feature">{feature}</td>
                      <td className="pro-comparison__td">
                        {free ? (
                          <Check size={20} className="pro-comparison__check" />
                        ) : (
                          <X size={20} className="pro-comparison__x" />
                        )}
                      </td>
                      <td className="pro-comparison__td pro-comparison__td--pro-cell">
                        {proText ? (
                          <span className="pro-comparison__label">{proText}</span>
                        ) : (
                          <Check size={20} className="pro-comparison__check" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </FadeInSection>

        {/* ── FAQ Accordion ─────────────────────────── */}
        <FadeInSection delay={200}>
          <section className="pro-faq">
            <h2 className="pro-faq__heading">Preguntas frecuentes</h2>
            <div className="pro-faq__list">
              {FAQ_ITEMS.map(({ question, answer }, index) => (
                <div
                  key={index}
                  className={`pro-faq__item ${openFaq === index ? 'pro-faq__item--open' : ''}`}
                >
                  <button
                    className="pro-faq__question"
                    onClick={() => handleToggleFaq(index)}
                    aria-expanded={openFaq === index}
                  >
                    <span>{question}</span>
                    <ChevronDown size={20} className="pro-faq__chevron" />
                  </button>
                  <div className="pro-faq__answer">
                    <p>{answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </FadeInSection>

        {/* ── Final CTA ─────────────────────────────── */}
        <FadeInSection delay={200}>
          <section className="pro-cta">
            <div className="pro-cta__container">
              <h2 className="pro-cta__title">
                ¿Listo para llevar tu música al siguiente nivel?
              </h2>
              <p className="pro-cta__subtitle">
                Unite a miles de amantes de la música que ya disfrutan Musicboxd Pro.
              </p>
              <button className="pro-cta__btn">
                <Crown size={18} />
                Comenzar con Pro
              </button>
            </div>
          </section>
        </FadeInSection>

      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
