// Punto único donde se registran TODAS las asociaciones entre entidades.
//
// Se definen acá y no dentro de cada archivo de entidad para evitar imports
// circulares y para tener el mapa completo de relaciones en un solo lugar.
// Importar este archivo (aunque sea por su efecto colateral) es lo que deja
// el modelo listo para usar.
import { Album } from './album.entity';
import { Artist } from './artist.entity';
import { Genre } from './genre.entity';
import { GenreAlbum } from './genre-album.entity';
import { Payment } from './payment.entity';
import { Plan } from './plan.entity';
import { Review } from './review.entity';
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

// CASCADE: si se elimina un álbum, su tracklist deja de tener sentido.
Album.hasMany(Song, { foreignKey: 'id_album', as: 'songs', onDelete: 'CASCADE' });
Song.belongsTo(Album, { foreignKey: 'id_album', as: 'album' });

// --- Reseñas ----------------------------------------------------------------

User.hasMany(Review, { foreignKey: 'id_user', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

Album.hasMany(Review, { foreignKey: 'id_album', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Album, { foreignKey: 'id_album', as: 'album' });

Song.hasMany(Review, { foreignKey: 'id_song', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Song, { foreignKey: 'id_song', as: 'song' });

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

export { Album, Artist, Genre, GenreAlbum, Payment, Plan, Review, Song, Subscription, User };
