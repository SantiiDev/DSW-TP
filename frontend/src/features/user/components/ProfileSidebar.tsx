// Columna lateral del perfil: promoción del plan, distribución de calificaciones
// y enlace para compartir.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Sparkles } from 'lucide-react';
import { UserRatingHistogram } from '../../review/components/UserRatingHistogram';
import type { ReviewStats } from '../../review/models/Review';
import type { User } from '../models/User';

type ProfileSidebarProps = {
  user: User;
  isOwnProfile: boolean;
  /**
   * Estadísticas de las reseñas del usuario, o null mientras se están pidiendo.
   * Las trae UserProfilePage una sola vez y las comparte con la cabecera.
   */
  stats: ReviewStats | null;
};

export const ProfileSidebar = ({ user, isOwnProfile, stats }: ProfileSidebarProps) => {
  const [copied, setCopied] = useState(false);

  // URL pública del perfil. Se arma con el origen actual para que sirva igual en
  // desarrollo y en producción, sin hardcodear el dominio.
  const profileUrl = `${window.location.origin}/users/${user.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      // Vuelve al texto original para que el botón se pueda usar de nuevo.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles (pasa sin HTTPS) no se rompe
      // nada: el usuario todavía puede copiar la URL de la barra de direcciones.
      setCopied(false);
    }
  };

  return (
    <aside className="profile-sidebar">
      {/* La promo solo tiene sentido en el perfil propio y si todavía no pagó. */}
      {isOwnProfile && user.rol === 'FREE' && (
        <div className="profile-sidebar__card profile-sidebar__card--pro">
          <span className="profile-sidebar__pro-badge">PRO</span>
          <p className="profile-sidebar__pro-text">
            Sacá los anuncios, personalizá tu perfil y desbloqueá tus estadísticas de escucha.
          </p>
          <Link to="/pro" className="profile-sidebar__pro-cta">
            <Sparkles size={16} aria-hidden="true" />
            Ver planes
          </Link>
        </div>
      )}

      <div className="profile-sidebar__card">
        <h2 className="profile-sidebar__card-title">Calificaciones</h2>
        {/* Son las notas que PUSO el usuario, de 0,5 a 5 estrellas: no cómo lo
            califican a él. Los datos salen de la feature review, que es la dueña
            de la tabla REVIEW. */}
        <UserRatingHistogram stats={stats} />
      </div>

      <div className="profile-sidebar__card">
        <h2 className="profile-sidebar__card-title">Compartir perfil</h2>
        <div className="profile-sidebar__share">
          <span className="profile-sidebar__share-url" title={profileUrl}>
            {profileUrl}
          </span>
          <button type="button" className="profile-sidebar__share-btn" onClick={handleCopy}>
            <Link2 size={15} aria-hidden="true" />
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </aside>
  );
};
