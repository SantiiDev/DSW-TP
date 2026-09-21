// Aviso que ve un usuario FREE cuando intenta armar una lista.
//
// Armar y curar listas es un beneficio de la membresía Pro: un FREE puede ver
// todas las listas, abrirlas, compartirlas y darles "me gusta", pero no crearlas
// ni editarlas. En vez de esconderle el botón —que dejaría la función invisible
// y nadie se enteraría de que existe—, el botón sigue estando y al apretarlo se
// explica por qué no se puede y a dónde ir.
//
// Es presentacional: no pide nada a la API ni decide nada. Quien corta de verdad
// es el backend, que a un FREE le responde 403 (ver assertCanWrite en
// list.service.ts).
//
// Mismo criterio visual que LockedStatsPreview, el cartel de la pestaña
// "Estadísticas", para que los dos beneficios Pro se anuncien igual.
import { Lock, Sparkles } from 'lucide-react';
import { ButtonLink } from '../../../core/components/Button';
import '../styles/_list.scss';

export const ProOnlyNotice = () => {
  return (
    <div className="pro-only">
      <span className="pro-only__icon" aria-hidden="true">
        <Lock size={22} />
      </span>
      <span className="pro-only__badge">PRO</span>

      <h3 className="pro-only__title">Armá tus propias listas</h3>
      <p className="pro-only__text">
        Crear listas de álbumes y de canciones es parte de la membresía Pro. Con una cuenta
        gratuita podés ver las de toda la comunidad y darles "me gusta".
      </p>

      <ButtonLink to="/pro">
        <Sparkles size={16} aria-hidden="true" />
        Pasarme a Pro
      </ButtonLink>
    </div>
  );
};
