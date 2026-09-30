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

export const AdRotator = () => {
  const { state } = useAuth();
  const { pathname } = useLocation();

  const [ads, setAds] = useState<Ad[]>([]);
  // Cuál de los anuncios toca. Avanza de a uno y vuelve al principio: así se ven
  // los cinco, en vez de depender de la suerte de un sorteo.
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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
        if (!cancelled) setAds(loaded);
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
  // está viendo: el minuto es siempre de navegación real y no corre mientras hay
  // un anuncio en pantalla. Navegar de una página a otra no lo reinicia, porque
  // `pathname` entra por `canShowAds` y no como dependencia suelta; entrar al
  // checkout sí lo cancela, y salir de ahí lo vuelve a arrancar desde cero.
  //
  // Al usuario no se le muestra en ningún lado cuánto falta: la publicidad
  // aparece sola, como en cualquier sitio.
  useEffect(() => {
    if (!canShowAds || isOpen) return;

    const timeoutId = setTimeout(() => setIsOpen(true), 60_000);
    return () => clearTimeout(timeoutId);
  }, [canShowAds, isOpen]);

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
