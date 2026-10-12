// Qué decir cuando el feed de /reviews vuelve vacío.
//
// Son cuatro situaciones distintas y cada una necesita una salida distinta:
// mandar a explorar música no le sirve a alguien que no sigue a nadie, y
// ofrecerle registrarse tampoco a quien ya tiene cuenta.
//
// Es una función pura y no JSX: decide el texto y QUÉ acción ofrecer; cómo se
// dibuja el botón y qué hace al apretarlo lo resuelve ReviewFeed.

/** Los dos modos del feed. Es el valor del toggle y el del parámetro ?scope. */
export type FeedScope = 'community' | 'friends';

/** Id del panel de gente para seguir, al que llevan los estados vacíos. */
export const SUGGESTIONS_SECTION_ID = 'gente-para-seguir';

/**
 * Salida que se le ofrece a quien ve el feed vacío:
 *   signup      -> abrir el registro
 *   suggestions -> bajar al panel "Gente para seguir"
 *   explore     -> ir a /music
 */
export type FeedEmptyActionKind = 'signup' | 'suggestions' | 'explore';

export type FeedEmptyState = {
  title: string;
  message: string;
  action: {
    kind: FeedEmptyActionKind;
    label: string;
    /** Botón destacado o de contorno. */
    variant: 'primary' | 'outline';
  };
};

type FeedEmptyStateInput = {
  scope: FeedScope;
  /** El feed de amigos pedido sin sesión: la API respondería 401. */
  isFriendsBlocked: boolean;
  /** A cuánta gente sigue el usuario, o null si todavía no se sabe. */
  followingCount: number | null;
  isAuthenticated: boolean;
};

/**
 * @returns el título, el mensaje y la acción del estado vacío del feed.
 */
export function getFeedEmptyState({
  scope,
  isFriendsBlocked,
  followingCount,
  isAuthenticated,
}: FeedEmptyStateInput): FeedEmptyState {
  if (isFriendsBlocked) {
    return {
      title: 'El feed de amigos es para gente con cuenta.',
      message: 'Creá la tuya y seguí a quien quieras leer.',
      action: { kind: 'signup', label: 'Registrarme', variant: 'primary' },
    };
  }

  if (scope === 'friends') {
    // followingCount todavía puede ser null si la respuesta no llegó; en ese
    // caso se muestra el mensaje general, que sirve para los dos casos.
    if (followingCount === 0) {
      return {
        title: 'Todavía no seguís a nadie.',
        message:
          'El feed de amigos se arma con las reseñas de la gente que seguís. Empezá por el panel de acá al lado.',
        action: { kind: 'suggestions', label: 'Descubrir gente', variant: 'primary' },
      };
    }

    return {
      title: 'La gente que seguís todavía no publicó reseñas.',
      message: 'Cuando alguno califique un álbum o una canción, va a aparecer acá.',
      action: { kind: 'suggestions', label: 'Seguir a más gente', variant: 'outline' },
    };
  }

  // Con sesión, la solapa "Comunidad" deja afuera las reseñas propias, así que
  // puede volver vacía aunque el usuario tenga las suyas publicadas. Decirle que
  // no hay ninguna en Musicboxd sería mentirle a quien acaba de escribir una.
  if (isAuthenticated) {
    return {
      title: 'Todavía no hay reseñas de otra gente.',
      message:
        'Acá vas a leer lo que califica el resto de la comunidad. Las tuyas están en tu perfil.',
      action: { kind: 'explore', label: 'Explorar música', variant: 'primary' },
    };
  }

  return {
    title: 'Todavía no hay reseñas en Musicboxd.',
    message: 'Entrá a un álbum o a una canción y calificalo: tu reseña abre el feed.',
    action: { kind: 'explore', label: 'Explorar música', variant: 'primary' },
  };
}
