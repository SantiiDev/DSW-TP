// Decide CUÁNDO y CUÁL anuncio mostrar. No dibuja nada propio: cuando le toca,
// monta AdModal, que es el que pone el panel en pantalla.
//
// Va montado una sola vez en App.tsx, al lado del modal de autenticación y FUERA
// del <div key={location.pathname}>. Eso último es lo importante: adentro de ese
// div, React lo desmontaría y lo volvería a montar en cada cambio de ruta, el
// reloj arrancaría de cero cada vez y el anuncio no llegaría a aparecer nunca
// para alguien que navega seguido.
//
// Esta es la contracara de la promesa de la membresía: el sitio ofrece "sin
// anuncios" como beneficio Pro, así que este componente es el que hace que ese
// beneficio signifique algo.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../../core/context/AuthContext';
import { adService } from '../../services/adService';
import type { Ad } from '../../models/Ad';
import { AdModal } from '../AdModal';

/**
 * Rutas donde no se interrumpe al usuario, por más FREE que sea.
 *
 * Es el flujo de pago: cortar a alguien que está por contratar la membresía con
 * la publicidad que justamente viene a sacarse sería la peor manera de perder la
 * venta.
 */
const SILENT_ROUTES = ['/pro/checkout', '/pro/return'];

/**
 * Cuánto navega un usuario FREE antes de que aparezca el próximo anuncio.
 *
 * Está acá arriba con nombre y no suelto en el setTimeout para que se vea de una
 * cada cuánto aparece la publicidad, que es la decisión que se ajusta.
 */
const AD_INTERVAL_MS = 20_000;

/** Cada cuánto se vuelve a mirar si el diálogo que frenó al anuncio ya se cerró. */
const DIALOG_RECHECK_MS = 3_000;

/**
 * ¿Hay un diálogo abierto en pantalla?
 *
 * Los dos modales del sitio (ConfirmDialog y FormModal) se marcan con
 * `aria-modal="true"`, que es lo que le avisa al lector de pantalla que atrapan
 * la atención. Se pregunta por ese atributo y no por una clase porque es
 * exactamente lo que interesa saber acá: si el usuario está escribiendo una
 * reseña, armando una lista o confirmando una baja, el anuncio no interrumpe.
 *
 * El propio AdModal NO lleva `aria-modal` (no bloquea nada, ver AdModal.tsx), así
 * que este chequeo no se detecta a sí mismo.
 */
function isDialogOpen(): boolean {
  return document.querySelector('[aria-modal="true"]') !== null;
}

export const AdRotator = () => {
  const { state } = useAuth();
  const { pathname } = useLocation();

  const [ads, setAds] = useState<Ad[]>([]);
  // Cuál de los anuncios toca. Arranca en uno al azar (ver el efecto de abajo) y
  // desde ahí avanza de a uno y vuelve al principio: así se ven todos, en vez de
  // depender de la suerte de un sorteo en cada aparición.
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  // true cuando el anuncio ya tendría que haber salido pero había un diálogo
  // abierto. Mientras esté así, el reloj de abajo no cuenta y lo único que corre es
  // el recontrol que espera a que ese diálogo se cierre.
  const [isPostponed, setIsPostponed] = useState(false);

  // Solo un FREE con la sesión abierta ve publicidad. Un visitante sin cuenta
  // tampoco: la vitrina pública queda limpia para el que todavía no se registró.
  const isFreeUser = state.status === 'authenticated' && state.user?.rol === 'FREE';

  // Se traen los anuncios una sola vez, cuando el usuario resulta ser FREE.
  //
  // Si la request falla no se muestra nada y listo. Es la excepción a la regla de
  // mostrar siempre un mensaje de error: un cartel rojo porque no cargó una
  // publicidad no le sirve a nadie, y el usuario no pierde ninguna función.
  useEffect(() => {
    if (!isFreeUser) return;

    let cancelled = false;

    adService
      .listActive()
      .then((loaded) => {
        if (cancelled) return;

        setAds(loaded);
        // La rotación arranca en un anuncio al azar y no siempre en el primero.
        // El índice vive en memoria, así que sin esto cada recarga de la página
        // volvería a empezar por el mismo: con cinco anuncios cargados, el
        // primero se vería muchas más veces que los otros cuatro.
        if (loaded.length > 0) setIndex(Math.floor(Math.random() * loaded.length));
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isFreeUser]);

  const isSilentRoute = SILENT_ROUTES.some((route) => pathname.startsWith(route));
  const canShowAds = isFreeUser && ads.length > 0 && !isSilentRoute;

  // El reloj del próximo anuncio.
  //
  // Depende de `isOpen`, así que se rearma recién cuando el usuario salta el que
  // está viendo: la espera es siempre de navegación real y no corre mientras hay
  // un anuncio en pantalla. Navegar de una página a otra no lo reinicia, porque
  // `pathname` entra por `canShowAds` y no como dependencia suelta; entrar al
  // checkout sí lo cancela, y salir de ahí lo vuelve a arrancar desde cero.
  //
  // Al usuario no se le muestra en ningún lado cuánto falta: la publicidad
  // aparece sola, como en cualquier sitio.
  //
  // Si al cumplirse la espera hay un diálogo abierto, el anuncio NO sale: queda
  // postergado. Interrumpir a alguien que está a mitad de un formulario sería peor
  // que esperar, y además el panel se dibujaría justo encima de lo que completa.
  useEffect(() => {
    if (!canShowAds || isOpen || isPostponed) return;

    const timeoutId = setTimeout(() => {
      if (isDialogOpen()) {
        setIsPostponed(true);
        return;
      }

      setIsOpen(true);
    }, AD_INTERVAL_MS);

    return () => clearTimeout(timeoutId);
  }, [canShowAds, isOpen, isPostponed]);

  // El recontrol: corre SOLO mientras el anuncio está postergado, y lo único que
  // hace es mirar si el diálogo ya se cerró. Cuando se cierra, la espera de arriba
  // arranca de nuevo completa, con el mismo criterio que rige todo el reloj: los 20
  // segundos son de navegación, y mientras hay un diálogo abierto el usuario no está
  // navegando.
  //
  // Va como intervalo y no como un timeout que se rearma porque un intervalo sigue
  // disparando sin depender de que React vuelva a renderizar: con un booleano que ya
  // está en true, poner el mismo valor otra vez no provoca render y el reloj quedaría
  // muerto.
  useEffect(() => {
    if (!isPostponed) return;

    const intervalId = setInterval(() => {
      if (!isDialogOpen()) setIsPostponed(false);
    }, DIALOG_RECHECK_MS);

    return () => clearInterval(intervalId);
  }, [isPostponed]);

  /** Cierra el anuncio actual y deja preparado el siguiente de la rotación. */
  const handleSkip = () => {
    setIsOpen(false);
    setIndex((current) => (current + 1) % ads.length);
  };

  if (!canShowAds || !isOpen) return null;

  // La key remonta el panel en cada aparición, y eso es lo que hace que la cuenta
  // regresiva de "Saltar" arranque de nuevo en 5 cada vez.
  const ad = ads[index];
  return <AdModal key={ad.id} ad={ad} onSkip={handleSkip} />;
};
