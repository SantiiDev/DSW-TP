// El panel de publicidad: aparece sobre el contenido, pegado al costado, y no se
// va hasta que el usuario lo saltea.
//
// NO bloquea el sitio. Se puede seguir scrolleando, entrando a un álbum o
// escribiendo una reseña con el anuncio en pantalla, igual que la publicidad
// flotante de cualquier página. Lo que molesta no es que frene la navegación
// sino que esté ahí, tapando una parte, hasta que uno se ocupa de sacarlo.
//
// Por eso tampoco se cierra con Escape ni con un click al costado, y no tiene una
// X: la única salida es el botón "Saltar", que se habilita a los cinco segundos.
// Es lo que le da sentido al beneficio Pro de no ver anuncios.
//
// Quién lo ve y cada cuánto aparece no se decide acá sino en AdRotator; este
// componente solo dibuja el anuncio que le pasan.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Button } from '../../../../core/components/Button';
import type { Ad } from '../../models/Ad';
import './AdModal.scss';

/** Segundos que hay que esperar antes de poder saltar el anuncio. */
const SKIP_DELAY_SECONDS = 5;

type AdModalProps = {
  ad: Ad;
  /** Cierra este anuncio y deja listo el siguiente de la rotación. */
  onSkip: () => void;
};

export const AdModal = ({ ad, onSkip }: AdModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(SKIP_DELAY_SECONDS);
  // Si el archivo de la imagen no está o quedó mal la ruta, se oculta el <img> y
  // el panel se muestra con el título y el texto. Es preferible a dejar el ícono
  // de imagen rota del navegador.
  const [imageFailed, setImageFailed] = useState(false);

  // La cuenta regresiva del botón. Se limpia sola al llegar a cero y también si el
  // componente se desmonta antes (el usuario salta apenas se habilita).
  useEffect(() => {
    if (secondsLeft === 0) return;

    const intervalId = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsLeft]);

  const canSkip = secondsLeft === 0;

  // La imagen es lo que ocupa casi todo el panel: el anuncio se lee de un vistazo
  // por la imagen, no por el texto.
  const image = (
    <img
      className="ad__image"
      src={ad.imageUrl}
      alt={ad.title}
      onError={() => setImageFailed(true)}
    />
  );

  /**
   * Envuelve la imagen en el enlace que corresponda.
   *
   * Un anuncio de afuera abre una pestaña nueva y deja el anuncio donde está. El
   * de la membresía Pro es una ruta del propio sitio, así que navega con React
   * Router (un <a> recargaría la página entera) y de paso se cierra: quedaría
   * ridículo seguir ofreciendo Pro arriba de la página de Pro.
   */
  const renderImage = () => {
    if (imageFailed) return null;

    if (ad.isInternalLink) {
      return (
        <Link className="ad__link" to={ad.targetUrl as string} onClick={onSkip}>
          {image}
        </Link>
      );
    }

    if (ad.hasLink) {
      return (
        <a
          className="ad__link"
          href={ad.targetUrl as string}
          target="_blank"
          rel="noopener noreferrer"
        >
          {image}
        </a>
      );
    }

    // Sin destino no se envuelve en nada: un enlace sin href no es un enlace y
    // confundiría al lector de pantalla.
    return image;
  };

  return createPortal(
    // Se dibuja con un portal directo al <body> por el mismo motivo que FormModal:
    // un `position: fixed` deja de medirse contra la ventana si algún ancestro
    // tiene `transform` o `will-change`, y el envoltorio de animación del sitio
    // (.fade-in-section) tiene justamente `will-change: transform`.
    //
    // El contenedor ocupa la pantalla entera solo para ubicar el panel en su
    // esquina; no recibe clicks (pointer-events: none en el .scss), así que todo
    // lo que queda debajo se sigue pudiendo usar con normalidad.
    <div className="ad-layer">
      {/* No es un diálogo: no bloquea ni atrapa el foco, así que va como <aside>
          y sin aria-modal. Marcarlo como modal le mentiría al lector de pantalla. */}
      <aside className="ad" aria-labelledby="ad-title">
        {/* Deja claro que es un aviso y no contenido de Musicboxd. */}
        <p className="ad__tag">Publicidad</p>

        {!imageFailed && <div className="ad__image-frame">{renderImage()}</div>}

        <div className="ad__body">
          <h2 id="ad-title" className="ad__title">
            {ad.title}
          </h2>

          {ad.hasDescription && <p className="ad__description">{ad.description}</p>}
        </div>

        <footer className="ad__footer">
          {/* El enganche con la membresía: es el motivo por el que el anuncio
              existe. Va en todos los anuncios y lleva a la página de venta. */}
          <Link className="ad__remove" to="/pro" onClick={onSkip}>
            Eliminar publicidad
          </Link>

          <Button size="sm" disabled={!canSkip} onClick={onSkip}>
            {canSkip ? 'Saltar anuncio' : `Saltar en ${secondsLeft}`}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body
  );
};
