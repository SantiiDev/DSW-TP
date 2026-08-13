// Curaduría del catálogo inicial: qué géneros y qué artistas descarga el seed.
//
// Este archivo es la "lista de compras" que lee `fetch-metadata.ts`. Está separado del
// script de descarga para que ampliar el catálogo sea editar datos, no tocar lógica.
//
// POR QUÉ LOS ARTISTAS ESTÁN ESCRITOS A MANO Y NO SE TOMAN DE LA API:
// Deezer expone un endpoint `/genre/{id}/artists`, pero devuelve un ranking general de
// popularidad, no una clasificación real por género: pedirle los artistas de "Rock"
// contesta BTS y Bad Bunny. Con una lista propia el catálogo queda coherente, y de paso
// permite incluir rock nacional argentino, que ningún chart de Deezer prioriza.
//
// POR QUÉ EL NOMBRE DEL GÉNERO ESTÁ ACÁ Y NO SE TOMA DEL DE DEEZER:
// Deezer traduce los nombres de sus géneros según la IP desde la que se lo consulta
// (desde Argentina contesta "Clásica", desde otro país "Classical"). Si guardáramos el
// nombre que viene en la respuesta, la base quedaría distinta según quién corra la
// descarga. Fijándolos acá, el resultado es siempre el mismo.

/**
 * Un artista de la curaduría.
 *
 * Normalmente alcanza con el nombre: el script lo busca en Deezer y se queda con la
 * página oficial. Para los nombres ambiguos —"Virus" es tanto una banda argentina de
 * los 80 como un rapero francés, y sin acentos se escriben igual— se puede fijar el id
 * de Deezer a mano y saltear la búsqueda.
 */
export type ArtistSelection = string | { name: string; deezerId: number };

/** Un género del catálogo y los artistas que se descargan para él. */
export type GenreSelection = {
  /** Id del género en Deezer, o `null` si es un género propio nuestro. */
  deezerId: number | null;
  /** Nombre con el que se guarda en la tabla `genres`. */
  name: string;
  /** Artistas a descargar. Se resuelven con `/search/artist` salvo que fijen su id. */
  artists: ArtistSelection[];
};

/** Cuántos álbumes se toman de cada artista. */
export const ALBUMS_PER_ARTIST = 3;

export const CATALOG: GenreSelection[] = [
  {
    deezerId: 132,
    name: 'Pop',
    artists: [
      'Michael Jackson',
      'Madonna',
      'Coldplay',
      'Dua Lipa',
      'Taylor Swift',
      'The Weeknd',
      'Billie Eilish',
    ],
  },
  {
    deezerId: 152,
    name: 'Rock',
    artists: [
      'Queen',
      'The Beatles',
      'Led Zeppelin',
      'Pink Floyd',
      'The Rolling Stones',
      'Nirvana',
      'Foo Fighters',
      'U2',
    ],
  },
  {
    deezerId: 85,
    name: 'Alternativo',
    artists: [
      'Radiohead',
      'Arctic Monkeys',
      'The Strokes',
      'Gorillaz',
      'Tame Impala',
      'The Smashing Pumpkins',
      'Interpol',
    ],
  },
  {
    deezerId: 116,
    name: 'Rap/Hip Hop',
    artists: [
      'Eminem',
      'Kendrick Lamar',
      'Kanye West',
      'Nas',
      '2Pac',
      'The Notorious B.I.G.',
      'A Tribe Called Quest',
    ],
  },
  {
    deezerId: 106,
    name: 'Electro',
    artists: [
      'Daft Punk',
      'The Chemical Brothers',
      'Aphex Twin',
      'Justice',
      'Kraftwerk',
      'Massive Attack',
      'The Prodigy',
    ],
  },
  {
    deezerId: 464,
    name: 'Metal',
    artists: [
      'Metallica',
      'Iron Maiden',
      'Black Sabbath',
      'Slipknot',
      'Megadeth',
      'Tool',
      'System of a Down',
    ],
  },
  {
    deezerId: 129,
    name: 'Jazz',
    artists: [
      'Miles Davis',
      'John Coltrane',
      'Bill Evans',
      'Herbie Hancock',
      'Thelonious Monk',
      'Charles Mingus',
      'Dave Brubeck',
    ],
  },
  {
    deezerId: 165,
    name: 'R&B',
    artists: [
      'Stevie Wonder',
      'Marvin Gaye',
      'Frank Ocean',
      "D'Angelo",
      'Alicia Keys',
      'Erykah Badu',
      'SZA',
    ],
  },
  {
    deezerId: 169,
    name: 'Soul & Funk',
    artists: [
      'James Brown',
      'Aretha Franklin',
      'Sly & The Family Stone',
      'Curtis Mayfield',
      'Otis Redding',
      'Earth, Wind & Fire',
      'Parliament',
    ],
  },
  {
    deezerId: 197,
    name: 'Latino',
    artists: [
      'Rubén Blades',
      // Buena Vista Social Club quedó afuera: Deezer solo tiene un EP suyo cargado.
      'Héctor Lavoe',
      'Celia Cruz',
      'Juan Luis Guerra',
      'Carlos Vives',
      'Rosalía',
      'Mercedes Sosa',
    ],
  },
  {
    // Género propio: Deezer no tiene una categoría de rock nacional argentino
    // (reparte a estos artistas entre "Rock", "Latino" y "Pop"). Se lo agrega como
    // género nuestro y se le asigna a mano a los álbumes de estos artistas.
    deezerId: null,
    name: 'Rock Nacional',
    artists: [
      'Soda Stereo',
      'Charly García',
      'Gustavo Cerati',
      'Luis Alberto Spinetta',
      'Sui Generis',
      'Patricio Rey y sus Redonditos de Ricota',
      'Divididos',
      'Los Fabulosos Cadillacs',
      'Babasónicos',
      'Serú Girán',
      'Fito Páez',
      'Andrés Calamaro',
      'La Renga',
      'Almendra',
      // Id fijo: buscar "Virus" devuelve antes al rapero francés Vîrus, que sin
      // acentos se escribe igual. 15338825 es la banda de Federico Moura.
      { name: 'Virus', deezerId: 15338825 },
      'Los Piojos',
      'El Mató a un Policía Motorizado',
    ],
  },
];
