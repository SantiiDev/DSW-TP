// Página /pro/return: a donde vuelve el usuario después de pasar por MercadoPago.
//
// MercadoPago redirige acá con el resultado en la query string:
//
//   /pro/return?payment_id=123&status=approved&external_reference=4:2
//
// Esta pantalla toma ese payment_id y le pide al backend que confirme el pago. Es
// importante que la confirmación la haga el BACKEND y no esta página: el `status`
// que viene en la URL lo puede escribir cualquiera a mano, así que no se usa para
// decidir nada, solo para explicar qué pasó cuando no hay pago que confirmar.
//
// Si el webhook ya había confirmado el pago, el backend responde que ya estaba
// registrado y no duplica nada. Los dos caminos terminan en el mismo lugar.
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Button, ButtonLink } from '../../../core/components/Button';
import { Loader } from '../../../core/components/Loader';
import { useAuth } from '../../../core/context/AuthContext';
import { useFetch } from '../../../core/hooks/useFetch';
import { membershipService } from '../services/membershipService';
import '../styles/_membership.scss';

/** En qué estado quedó la confirmación. Decide qué se dibuja. */
type ConfirmState = 'checking' | 'activated' | 'pending' | 'failed';

/** Qué se le dice al que volvió sin haber pagado (canceló y apretó "volver"). */
const NO_PAYMENT_MESSAGE =
  'No se completó ningún pago, así que tu membresía quedó como estaba.';

export const ProReturnPage = () => {
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();

  // MercadoPago manda el id del pago como payment_id, y en algunos flujos como
  // collection_id. Es el mismo número: se acepta cualquiera de los dos.
  const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id');

  // La confirmación se pide con useFetch, igual que cualquier otra carga de la
  // app: él se ocupa del loading, del error ya traducido y de reintentar.
  //
  // El refresco del token va DENTRO del fetcher y no en un efecto aparte porque
  // es parte de la misma operación: confirmar el pago no está terminado hasta que
  // el token dice PRO. Sin eso el backend seguiría viendo un FREE y rechazaría
  // justo las rutas que el usuario acaba de comprar.
  const {
    data: result,
    isLoading,
    error,
    reload,
  } = useFetch(async () => {
    // Sin id no hay nada que confirmar. Pasa si el usuario canceló el pago y
    // volvió con el botón: ahí MercadoPago no genera ningún pago.
    if (!paymentId) return null;

    const confirmation = await membershipService.confirmPayment(paymentId);
    if (confirmation.status === 'approved') await refreshSession();

    return confirmation;
  });

  // El estado de la pantalla se DERIVA de la carga, no se guarda aparte: son la
  // misma información y tenerla duplicada es lo que las hace desincronizarse.
  const state: ConfirmState = isLoading
    ? 'checking'
    : error || !result
      ? 'failed'
      : result.status === 'approved'
        ? 'activated'
        : 'pending';

  const message = error ?? result?.message ?? NO_PAYMENT_MESSAGE;

  return (
    <>
      <Navbar />
      <main className="pro-return">
        {state === 'checking' && <Loader message="Confirmando tu pago..." />}

        {state === 'activated' && (
          <section className="pro-return__panel pro-return__panel--ok">
            <CheckCircle2 size={56} aria-hidden="true" />
            <h1 className="pro-return__title">¡Bienvenido a Pro!</h1>
            <p className="pro-return__message">{message}</p>
            <div className="pro-return__actions">
              <ButtonLink to="/pro">Ver mi membresía</ButtonLink>
              <ButtonLink to="/music" variant="outline">
                Explorar música
              </ButtonLink>
            </div>
          </section>
        )}

        {state === 'pending' && (
          <section className="pro-return__panel pro-return__panel--pending">
            <Clock size={56} aria-hidden="true" />
            <h1 className="pro-return__title">Tu pago está en proceso</h1>
            <p className="pro-return__message">{message}</p>
            <p className="pro-return__hint">
              Algunos medios de pago tardan un rato en acreditarse. Cuando se apruebe, tu
              membresía se activa sola.
            </p>
            <div className="pro-return__actions">
              {/* Reintentar la consulta es más barato que recargar la página
                  entera, y es lo que el usuario va a querer hacer. */}
              <Button onClick={() => void reload()}>Volver a consultar</Button>
              <ButtonLink to="/pro" variant="outline">
                Ir a mi membresía
              </ButtonLink>
            </div>
          </section>
        )}

        {state === 'failed' && (
          <section className="pro-return__panel pro-return__panel--error">
            <XCircle size={56} aria-hidden="true" />
            <h1 className="pro-return__title">No pudimos activar tu membresía</h1>
            <p className="pro-return__message">{message}</p>
            <div className="pro-return__actions">
              <ButtonLink to="/pro">Probar de nuevo</ButtonLink>
              <Link to="/contact" className="pro-return__link">
                Contactar soporte
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
};
