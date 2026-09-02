// Página /pro/checkout: el resumen de lo que se está por contratar.
//
// Es el paso que va ENTRE la página de venta y MercadoPago. Antes el botón
// "Pasarme a Pro" sacaba al usuario del sitio de una, sin que llegara a ver qué
// estaba comprando, por cuánto ni hasta cuándo. Acá lo ve, y recién cuando
// confirma se crea la orden de pago.
//
// La pantalla NO cobra: crea la preference en MercadoPago (POST
// /api/payments/checkout) y redirige. El cobro pasa allá, y la vuelta la atiende
// /pro/return.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Check,
  ListMusic,
  Lock,
  Palette,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { BackLink } from '../../../core/components/BackLink';
import { Button } from '../../../core/components/Button';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { Navbar } from '../../../core/components/Navbar';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { membershipService } from '../services/membershipService';
import { PRO_PLAN_NAME, calculateCoverageEnd } from '../models/Membership';
import '../styles/_membership.scss';

/** Lo que incluye la membresía. Es el detalle de lo que se está comprando. */
const INCLUDED = [
  { icon: Sparkles, label: 'Navegación sin anuncios' },
  { icon: BarChart3, label: 'Estadísticas avanzadas de tu año en música' },
  { icon: Palette, label: 'Personalización del perfil' },
  { icon: ListMusic, label: 'Listas ilimitadas' },
  { icon: ShieldCheck, label: 'Aportar artistas, álbumes y canciones al catálogo' },
];

/** Formatea una fecha como "12 de agosto de 2026". */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const ProCheckoutPage = () => {
  const { state: authState } = useAuth();

  const { data: plans, isLoading, error } = useFetch(() => membershipService.listPlans());
  const proPlan = plans?.find((plan) => plan.name === PRO_PLAN_NAME) ?? null;

  // Mientras se crea la orden en MercadoPago, para no permitir dos clicks (que
  // generarían dos preferences y dos órdenes de pago distintas).
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const today = new Date();
  const coverageEnd = calculateCoverageEnd(today);

  const handleConfirm = async () => {
    if (!proPlan) return;

    setIsRedirecting(true);
    setCheckoutError(null);

    try {
      const checkoutUrl = await membershipService.startCheckout(proPlan.id);
      // Acá se sale de la aplicación. Al terminar, MercadoPago devuelve al
      // usuario a /pro/return, que es donde se confirma el pago.
      window.location.href = checkoutUrl;
    } catch (startError) {
      setCheckoutError(getErrorMessage(startError));
      setIsRedirecting(false);
    }
  };

  if (isLoading) return <Loader message="Cargando el detalle de tu compra..." />;

  return (
    <>
      <Navbar />
      <main className="checkout">
        {/* El "Volver" compartido de core/components, igual que en el resto del
            sitio. Sin historial propio cae en /pro, que es de donde se llega. */}
        <BackLink fallbackTo="/pro" label="Volver a los planes" />

        <h1 className="checkout__title">Confirmá tu membresía</h1>
        <p className="checkout__subtitle">
          Revisá el detalle antes de continuar. El pago se hace en MercadoPago.
        </p>

        {error && <Alert tone="error">{error}</Alert>}
        {checkoutError && <Alert tone="error">{checkoutError}</Alert>}

        {!error && !proPlan && (
          <Alert tone="error">
            No encontramos el plan Pro. Avisale a un administrador para que lo revise.
          </Alert>
        )}

        {proPlan && (
          <div className="checkout__grid">
            {/* Columna izquierda: qué se lleva. */}
            <section className="checkout__panel">
              <h2 className="checkout__panel-title">Qué incluye</h2>
              <ul className="checkout__included">
                {INCLUDED.map(({ icon: Icon, label }) => (
                  <li key={label}>
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="checkout__period">
                <CalendarDays size={18} aria-hidden="true" />
                <div>
                  <span className="checkout__period-label">Período que cubre</span>
                  <span className="checkout__period-value">
                    {formatDate(today)} — {formatDate(coverageEnd)}
                  </span>
                </div>
              </div>

              {/* Que no se renueve sola es LO que hay que decir antes de cobrar:
                  es la diferencia con lo que la mayoría espera de una membresía. */}
              <p className="checkout__disclaimer">
                Es un pago único por un mes. <strong>No se renueva automáticamente</strong> y no
                guardamos los datos de tu tarjeta: cuando venza, si querés seguir, lo activás de
                nuevo desde tu perfil.
              </p>
            </section>

            {/* Columna derecha: cuánto sale y el botón. */}
            <aside className="checkout__summary">
              <h2 className="checkout__panel-title">Resumen</h2>

              <div className="checkout__line">
                <span>Membresía {proPlan.name}</span>
                <span>{proPlan.priceLabel}</span>
              </div>
              <div className="checkout__line checkout__line--muted">
                <span>Duración</span>
                <span>1 mes</span>
              </div>

              <div className="checkout__total">
                <span>Total a pagar</span>
                <strong>{proPlan.priceLabel}</strong>
              </div>

              <Button
                fullWidth
                onClick={() => void handleConfirm()}
                disabled={isRedirecting}
              >
                {isRedirecting ? 'Redirigiendo...' : 'Ir a pagar'}
              </Button>

              <p className="checkout__secure">
                <Lock size={14} aria-hidden="true" />
                Te llevamos a MercadoPago para pagar de forma segura.
              </p>

              <ul className="checkout__steps">
                <li>
                  <Check size={14} aria-hidden="true" /> Elegís cómo pagar en MercadoPago
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Volvés a Musicboxd
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Tu cuenta {authState.user?.username} queda
                  Pro al instante
                </li>
              </ul>

              <Link to="/faq" className="checkout__help">
                ¿Tenés dudas? Mirá las preguntas frecuentes
              </Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};
