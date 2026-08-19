// Cara "de venta" de la página /pro: la que ve un visitante o un usuario Free.
// Muestra el pitch de la membresía (hero, planes, beneficios, comparativa y FAQ).
//
// El botón de contratación cambia según haya sesión o no: a un visitante lo
// invita a crear su cuenta, y a un usuario Free ya no le ofrece registrarse
// —que no tendría sentido— sino pasar al plan pago.
import { useState } from 'react';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { ProBenefits } from './ProBenefits';
import { ProComparison } from './ProComparison';
import { ProFaq } from './ProFaq';
import {
  Crown,
  BarChart3,
  Palette,
  Shield,
  Star,
  Ban,
  ListMusic,
  Sparkles,
  HeadphonesIcon,
} from 'lucide-react';

type ProSalesViewProps = {
  /** true si el usuario ya inició sesión (y todavía está en el plan Free). */
  isAuthenticated: boolean;
};

export const ProSalesView = ({ isAuthenticated }: ProSalesViewProps) => {
  const { openSignup } = useAuthModal();

  // La pasarela de pago (MercadoPago) todavía no está conectada. En vez de dejar
  // un botón que no hace nada, al usuario logueado se le muestra un aviso claro.
  const [showCheckoutNote, setShowCheckoutNote] = useState(false);

  // Un visitante primero necesita una cuenta; el que ya entró la tiene, y lo
  // único que le falta es el pago.
  const handleUpgradeClick = () => {
    if (isAuthenticated) {
      setShowCheckoutNote(true);
      return;
    }
    openSignup();
  };

  const upgradeLabel = isAuthenticated ? 'Pasarme a Pro' : 'Obtener Pro';

  return (
    <>
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
                {upgradeLabel}
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
              <button
                type="button"
                className="pro-pricing__card-btn pro-pricing__card-btn--outline"
                disabled
              >
                {isAuthenticated ? 'Tu plan actual' : 'Plan gratuito'}
              </button>
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
                <li><Sparkles size={18} /> Aportá al catálogo</li>
              </ul>
              <button
                type="button"
                className="pro-pricing__card-btn pro-pricing__card-btn--primary"
                onClick={handleUpgradeClick}
              >
                <Crown size={16} />
                {upgradeLabel}
              </button>

              {showCheckoutNote && (
                <p className="pro-pricing__card-note" role="status">
                  Estamos terminando de conectar el pago con MercadoPago. Muy pronto vas a poder
                  activar tu membresía Pro desde acá.
                </p>
              )}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── Beneficios que incluye Pro ───────────── */}
      <FadeInSection delay={200}>
        <ProBenefits heading="¿Qué incluye Pro?" />
      </FadeInSection>

      {/* ── Comparativa Free vs Pro ──────────────── */}
      <FadeInSection delay={200}>
        <ProComparison />
      </FadeInSection>

      {/* ── FAQ ──────────────────────────────────── */}
      <FadeInSection delay={200}>
        <ProFaq />
      </FadeInSection>

      {/* ── Final CTA ────────────────────────────── */}
      <FadeInSection delay={200}>
        <section className="pro-cta">
          <div className="pro-cta__container">
            <h2 className="pro-cta__title">
              ¿Listo para llevar tu música al siguiente nivel?
            </h2>
            <p className="pro-cta__subtitle">
              Sumate a los que ya disfrutan Musicboxd Pro.
            </p>
            <button type="button" className="pro-cta__btn" onClick={handleUpgradeClick}>
              <Crown size={18} />
              {isAuthenticated ? 'Pasarme a Pro' : 'Comenzar con Pro'}
            </button>
          </div>
        </section>
      </FadeInSection>
    </>
  );
};
