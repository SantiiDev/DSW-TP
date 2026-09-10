// Punto único donde se registran TODAS las asociaciones entre entidades.
//
// Se definen acá y no dentro de cada archivo de entidad para evitar imports
// circulares y para tener el mapa completo de relaciones en un solo lugar.
// Importar este archivo (aunque sea por su efecto colateral) es lo que deja
// el modelo listo para usar.
import { Album } from './album.entity';
import { Artist } from './artist.entity';
import { Follow } from './follow.entity';
import { Genre } from './genre.entity';
import { GenreAlbum } from './genre-album.entity';
import { Payment } from './payment.entity';
import { Plan } from './plan.entity';
import { Review } from './review.entity';
import { ReviewComment } from './review-comment.entity';
import { ReviewLike } from './review-like.entity';
import { Song } from './song.entity';
import { Subscription } from './subscription.entity';
import { User } from './user.entity';

// --- Membresías: USERS 0:N --- subscription --- 1:M PLAN --------------------

// Un usuario acumula una suscripción por cada plan que contrata a lo largo del tiempo.
User.hasMany(Subscription, { foreignKey: 'id_user', as: 'subscriptions', onDelete: 'CASCADE' });
Subscription.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// Un plan no se puede borrar si tiene suscripciones: se perdería el historial.
Plan.hasMany(Subscription, { foreignKey: 'id_plan', as: 'subscriptions', onDelete: 'RESTRICT' });
Subscription.belongsTo(Plan, { foreignKey: 'id_plan', as: 'plan' });

// --- Pagos: SUBSCRIPTION 1:1 --- subscription_payment --- 0:M PAYMENTS ------

// RESTRICT porque un registro de pago nunca debe desaparecer por un borrado en cascada.
Subscription.hasMany(Payment, {
  foreignKey: 'id_subscription',
  as: 'payments',
  onDelete: 'RESTRICT',
});
Payment.belongsTo(Subscription, { foreignKey: 'id_subscription', as: 'subscription' });

// --- Catálogo: ARTIST 1:1 --- artist_albums --- 0:M ALBUMS ------------------

// RESTRICT: no se borra un artista que todavía tiene álbumes cargados.
Artist.hasMany(Album, { foreignKey: 'id_artist', as: 'albums', onDelete: 'RESTRICT' });
Album.belongsTo(Artist, { foreignKey: 'id_artist', as: 'artist' });

// --- Catálogo: GENRES N:M ALBUMS (tabla GENRES_ALBUMS) ----------------------

Album.belongsToMany(Genre, {
  through: GenreAlbum,
  foreignKey: 'id_album',
  otherKey: 'id_genre',
  as: 'genres',
});
Genre.belongsToMany(Album, {
  through: GenreAlbum,
  foreignKey: 'id_genre',
  otherKey: 'id_album',
  as: 'albums',
});

// --- Catálogo: ALBUMS 0:1 --- albums_song --- 1:N SONG ----------------------

// RESTRICT: no se borra un álbum que todavía tiene canciones cargadas. Antes era
// CASCADE, pero así la baja del álbum se llevaba puesto su tracklist entero sin
// avisar; ahora primero hay que dar de baja las canciones.
Album.hasMany(Song, { foreignKey: 'id_album', as: 'songs', onDelete: 'RESTRICT' });
Song.belongsTo(Album, { foreignKey: 'id_album', as: 'album' });

// --- Reseñas ----------------------------------------------------------------

User.hasMany(Review, { foreignKey: 'id_user', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// RESTRICT: no se borra un álbum que todavía tiene reseñas propias cargadas. Son
// opiniones escritas por la comunidad, no un dato derivado del álbum: la baja
// tiene que rechazarse en vez de hacerlas desaparecer en silencio.
Album.hasMany(Review, { foreignKey: 'id_album', as: 'reviews', onDelete: 'RESTRICT' });
Review.belongsTo(Album, { foreignKey: 'id_album', as: 'album' });

// CASCADE, a diferencia del álbum: una canción sí se puede dar de baja aunque
// tenga reseñas, y esas reseñas se pierden con ella. Una reseña de canción
// califica esa pista y nada más, así que sin la pista no queda nada que reseñar.
Song.hasMany(Review, { foreignKey: 'id_song', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Song, { foreignKey: 'id_song', as: 'song' });

// --- Interacción con las reseñas: "me gusta" y comentarios -------------------
//
// Las dos son un AGREGADO al DER original (ver el encabezado de cada entidad).

// El "me gusta" es una N:M entre usuarios y reseñas, igual que géneros y álbumes.
// CASCADE en las dos puntas: el "me gusta" no significa nada sin el usuario que lo
// puso ni sin la reseña que lo recibió, así que no tiene por qué sobrevivir a
// ninguno de los dos.
Review.belongsToMany(User, {
  through: ReviewLike,
  foreignKey: 'id_review',
  otherKey: 'id_user',
  as: 'likedBy',
});
User.belongsToMany(Review, {
  through: ReviewLike,
  foreignKey: 'id_user',
  otherKey: 'id_review',
  as: 'likedReviews',
});

// Además del N:M se declara el hasMany contra la tabla intermedia, porque el
// conteo de "me gusta" se hace sobre ella directamente: para saber cuántos tiene
// una reseña no hace falta traer los usuarios enteros.
Review.hasMany(ReviewLike, { foreignKey: 'id_review', as: 'likes', onDelete: 'CASCADE' });
ReviewLike.belongsTo(Review, { foreignKey: 'id_review', as: 'review' });
ReviewLike.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// El comentario es una entidad débil de REVIEW: CASCADE porque no existe sin la
// reseña que comenta.
Review.hasMany(ReviewComment, { foreignKey: 'id_review', as: 'comments', onDelete: 'CASCADE' });
ReviewComment.belongsTo(Review, { foreignKey: 'id_review', as: 'review' });

// CASCADE también del lado del autor, igual que con las reseñas: si se borra la
// cuenta, se van sus comentarios.
User.hasMany(ReviewComment, { foreignKey: 'id_user', as: 'comments', onDelete: 'CASCADE' });
ReviewComment.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// --- Seguimiento entre usuarios: USERS N:M USERS ----------------------------
//
// AGREGADO AL DER ORIGINAL (ver el encabezado de follow.entity.ts). Es lo que
// alimenta el feed social: "las reseñas de la gente que sigo".
//
// Es la única relación RECURSIVA del modelo: los dos extremos son USERS. Por eso
// cada lado necesita su propia clave foránea y su propio alias; si los dos
// usaran el mismo, Sequelize no tendría forma de saber cuál de las dos columnas
// es "el que sigue".
User.belongsToMany(User, {
  through: Follow,
  as: 'following', // a quiénes sigue este usuario
  foreignKey: 'id_follower',
  otherKey: 'id_followed',
});
User.belongsToMany(User, {
  through: Follow,
  as: 'followers', // quiénes siguen a este usuario
  foreignKey: 'id_followed',
  otherKey: 'id_follower',
});

// Igual que con los "me gusta", además del N:M se declara el hasMany contra la
// tabla intermedia: los contadores y la lista de ids seguidos se resuelven sobre
// ella directamente, sin traer los usuarios enteros.
//
// De hecho la feature follow consulta SIEMPRE por acá y nunca por el
// belongsToMany de arriba: User tiene un defaultScope que excluye la contraseña,
// y ese exclude combinado con un self-join con alias es una fuente conocida de
// consultas raras en Sequelize 6. El belongsToMany se declara igual porque es la
// relación del DER y documenta el modelo, exactamente como pasa con likedBy.
//
// CASCADE en las dos puntas: un seguimiento no significa nada sin ninguno de los
// dos usuarios. En la práctica no dispara nunca, porque la baja de un usuario es
// lógica (state = 'suspended').
User.hasMany(Follow, { foreignKey: 'id_follower', as: 'followingLinks', onDelete: 'CASCADE' });
User.hasMany(Follow, { foreignKey: 'id_followed', as: 'followerLinks', onDelete: 'CASCADE' });
Follow.belongsTo(User, { foreignKey: 'id_follower', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'id_followed', as: 'followed' });

// --- Autoría del contenido de catálogo (created_by) -------------------------
//
// SET NULL: si se da de baja al usuario que aportó un álbum, el álbum sobrevive
// y simplemente queda sin autor registrado.

Artist.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
User.hasMany(Artist, { foreignKey: 'created_by', as: 'createdArtists', onDelete: 'SET NULL' });

Album.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
User.hasMany(Album, { foreignKey: 'created_by', as: 'createdAlbums', onDelete: 'SET NULL' });

Song.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
User.hasMany(Song, { foreignKey: 'created_by', as: 'createdSongs', onDelete: 'SET NULL' });

export {
  Album,
  Artist,
  Follow,
  Genre,
  GenreAlbum,
  Payment,
  Plan,
  Review,
  ReviewComment,
  ReviewLike,
  Song,
  Subscription,
  User,
};
