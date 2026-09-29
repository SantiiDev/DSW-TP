// Entidad ADS.
// ADS (id_ad, title, description, url_image, target_url, active)
//   id_ad -> PK
//
// AGREGADO AL DER ORIGINAL. Sostiene la promesa de la propuesta: la membresía Pro
// ofrece una "experiencia sin anuncios", así que para que eso signifique algo
// tiene que existir un anuncio que ver. Un usuario FREE ve uno cada tanto; un PRO
// o un ADMIN, ninguno.
//
// Es la ÚNICA entidad suelta del modelo: no tiene ninguna clave foránea. Un
// anuncio no pertenece a ningún usuario ni apunta a nada del catálogo, es una
// pieza de publicidad que carga el sitio y se muestra tal cual. Por eso tampoco
// tiene `state` de moderación ni `created_by`, a diferencia de ARTIST, ALBUMS y
// SONG: un anuncio no lo aporta un usuario PRO.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class Ad extends Model<InferAttributes<Ad>, InferCreationAttributes<Ad>> {
  declare id_ad: CreationOptional<number>;
  declare title: string;
  declare description: string | null;
  declare url_image: string;
  declare target_url: string | null;
  declare active: CreationOptional<boolean>;
}

Ad.init(
  {
    id_ad: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(80),
      allowNull: false,
      // El índice único se declara abajo con nombre; ver la nota en `indexes`.
      validate: { notEmpty: { msg: 'El título del anuncio no puede estar vacío.' } },
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    // Ruta de la imagen dentro de public/ del frontend ("/images/ads/ad-vinyl.jpg").
    // Se guarda igual que url_cover o url_avatar: la columna es el camino a la
    // imagen, no la imagen.
    url_image: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { notEmpty: { msg: 'El anuncio necesita una imagen.' } },
    },
    // A dónde lleva el anuncio al hacerle click. Es nullable porque un anuncio
    // puede ser solo gráfico: si queda en NULL, el frontend muestra la imagen sin
    // envolverla en un enlace.
    target_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Permite sacar un anuncio de circulación sin borrarlo, que es lo que hace el
    // interruptor de la tabla del panel de administración.
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'ads',
    // Índice único nombrado en vez de `unique: true` en la columna: con
    // sync({ alter: true }) un índice sin nombre se vuelve a crear en cada
    // arranque hasta romper el límite de 64 índices de MySQL.
    // Ver la explicación completa en user.entity.ts.
    //
    // Además de evitar dos anuncios con el mismo título, es lo que hace idempotente
    // al seed: seed-ads.ts busca por `title` con findOrCreate.
    indexes: [{ name: 'ads_title_unique', unique: true, fields: ['title'] }],
  }
);
