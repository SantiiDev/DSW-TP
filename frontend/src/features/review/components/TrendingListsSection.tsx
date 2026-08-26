// Sección de listas en tendencia que muestra un feed vertical de cards con listas populares recientes.
import { TrendingUp, Heart, MessageCircle, Music } from 'lucide-react';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Datos mock de listas en tendencia con portadas simuladas
const TRENDING_LISTS = [
  {
    id: 1,
    title: 'Álbumes que Te Cambian la Vida',
    author: 'melomaniac_23',
    authorColor: '#e94560',
    description: 'Una selección de álbumes que marcan un antes y un después en tu forma de escuchar música. Desde clásicos atemporales hasta joyas ocultas.',
    albumCount: 42,
    likes: 1283,
    comments: 87,
    covers: [
      'https://placehold.co/300x300/1a1a2e/e94560?text=OK+Computer',
      'https://placehold.co/300x300/16213e/0f3460?text=TPAB',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Loveless',
      'https://placehold.co/300x300/1b1b2f/e43f5a?text=Kid+A',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Blonde',
    ],
  },
  {
    id: 2,
    title: 'Lo Mejor del 2025 Hasta Ahora',
    author: 'santino_g',
    authorColor: '#1ED760',
    description: 'Mi ranking personal de los mejores lanzamientos de este año. Pop, hip-hop, indie y más — todo lo que vale la pena escuchar.',
    albumCount: 35,
    likes: 956,
    comments: 63,
    covers: [
      'https://placehold.co/300x300/0f3460/16c79a?text=GNX',
      'https://placehold.co/300x300/2d3436/00cec9?text=Chromak',
      'https://placehold.co/300x300/3c1642/f5a623?text=Brat',
      'https://placehold.co/300x300/1a1a2e/e94560?text=HMHS',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Cowboy',
    ],
  },
  {
    id: 3,
    title: 'Discografías Perfectas',
    author: 'album_critic',
    authorColor: '#feca57',
    description: 'Artistas que nunca fallaron. Cada álbum de su carrera es una obra maestra. ¿Coincidís con mi selección?',
    albumCount: 28,
    likes: 2104,
    comments: 142,
    covers: [
      'https://placehold.co/300x300/2d3436/dfe6e9?text=Beatles',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Bowie',
      'https://placehold.co/300x300/1a1a2e/e94560?text=Radiohead',
      'https://placehold.co/300x300/3c1642/f5a623?text=Kanye',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Bjork',
    ],
  },
  {
    id: 4,
    title: 'Álbumes para una Noche Lluviosa',
    author: 'moody_listener',
    authorColor: '#48dbfb',
    description: 'Cuando llueve y querés algo que acompañe ese mood. Ambient, shoegaze, dream pop y todo lo atmosférico.',
    albumCount: 30,
    likes: 876,
    comments: 45,
    covers: [
      'https://placehold.co/300x300/2c003e/a29bfe?text=Disinteg',
      'https://placehold.co/300x300/0f3460/74b9ff?text=Souvlaki',
      'https://placehold.co/300x300/1b1b2f/576574?text=SAP',
      'https://placehold.co/300x300/2d3436/636e72?text=Carrie',
      'https://placehold.co/300x300/16213e/0f3460?text=Heaven',
    ],
  },
  {
    id: 5,
    title: 'Hip-Hop Esencial: De los 90s al Presente',
    author: 'hiphop_head',
    authorColor: '#ff6b6b',
    description: 'Un recorrido por lo mejor del hip-hop desde la golden era hasta los nuevos clásicos. Nas, Kendrick, MF DOOM y muchos más.',
    albumCount: 65,
    likes: 1567,
    comments: 98,
    covers: [
      'https://placehold.co/300x300/1a1a2e/e94560?text=Illmatic',
      'https://placehold.co/300x300/0f3460/16c79a?text=MBDTF',
      'https://placehold.co/300x300/3c1642/f5a623?text=Madvillainy',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=GKMC',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Aquemini',
    ],
  },
  {
    id: 6,
    title: 'Debuts que Cambiaron Todo',
    author: 'first_spin',
    authorColor: '#a29bfe',
    description: 'Primeros álbumes que definieron géneros enteros. Cuando un debut es tan bueno que reescribe las reglas.',
    albumCount: 40,
    likes: 1321,
    comments: 76,
    covers: [
      'https://placehold.co/300x300/2d3436/00cec9?text=Debut',
      'https://placehold.co/300x300/1a1a2e/e94560?text=PH',
      'https://placehold.co/300x300/0f3460/16c79a?text=Doolittle',
      'https://placehold.co/300x300/3c1642/f5a623?text=Funeral',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=IS+THIS',
    ],
  },
  {
    id: 7,
    title: 'Bandas Sonoras Inolvidables',
    author: 'cine_sounds',
    authorColor: '#fd79a8',
    description: 'Las mejores bandas sonoras del cine y la TV. Música que trasciende la pantalla y se convierte en arte por sí sola.',
    albumCount: 50,
    likes: 987,
    comments: 54,
    covers: [
      'https://placehold.co/300x300/2d3436/dfe6e9?text=Interstellar',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Inception',
      'https://placehold.co/300x300/1a1a2e/e94560?text=Drive',
      'https://placehold.co/300x300/3c1642/f5a623?text=Amelie',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Tron',
    ],
  },
  {
    id: 8,
    title: 'Rock Progresivo: La Guía Definitiva',
    author: 'prog_master',
    authorColor: '#00cec9',
    description: 'De Pink Floyd a King Crimson, de Yes a Tool. Todo lo que necesitás saber sobre prog rock en una lista.',
    albumCount: 55,
    likes: 1102,
    comments: 89,
    covers: [
      'https://placehold.co/300x300/1a1a2e/e94560?text=DSOTM',
      'https://placehold.co/300x300/0f3460/16c79a?text=ITCOTCK',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Close',
      'https://placehold.co/300x300/3c1642/f5a623?text=Lateralus',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Fragile',
    ],
  },
  {
    id: 9,
    title: 'Joyas Ocultas del 2024',
    author: 'deep_digger',
    authorColor: '#ffeaa7',
    description: 'Álbumes increíbles que pasaron desapercibidos el año pasado. Dale una oportunidad a estos artistas emergentes.',
    albumCount: 25,
    likes: 743,
    comments: 38,
    covers: [
      'https://placehold.co/300x300/2d3436/636e72?text=Hidden1',
      'https://placehold.co/300x300/1b1b2f/576574?text=Hidden2',
      'https://placehold.co/300x300/16213e/0f3460?text=Hidden3',
      'https://placehold.co/300x300/0f3460/74b9ff?text=Hidden4',
      'https://placehold.co/300x300/2c003e/a29bfe?text=Hidden5',
    ],
  },
  {
    id: 10,
    title: 'Música Latina Esencial',
    author: 'latin_beats',
    authorColor: '#f9ca24',
    description: 'Desde el reggaetón hasta la bossa nova, pasando por el rock en español. Lo mejor de la música en nuestro idioma.',
    albumCount: 48,
    likes: 1654,
    comments: 112,
    covers: [
      'https://placehold.co/300x300/e94560/fff?text=Bad+Bunny',
      'https://placehold.co/300x300/0f3460/16c79a?text=Cerati',
      'https://placehold.co/300x300/f5a623/fff?text=Rosalia',
      'https://placehold.co/300x300/2c003e/d4a5ff?text=Cafe+T',
      'https://placehold.co/300x300/0c2461/48dbfb?text=Drexler',
    ],
  },
];

export const TrendingListsSection = () => {
  const { openSignup } = useAuthModal();

  return (
    <section className="trending-lists">
      <SectionHeader
        icon={<TrendingUp size={22} />}
        title="Listas en Tendencia"
        iconTone="fire"
        actionLabel="Ver todas"
        onAction={openSignup}
      />

      <div className="trending-lists__feed">
        {TRENDING_LISTS.map((list) => (
          <article key={list.id} className="trending-list-card" onClick={openSignup} style={{ cursor: 'pointer' }}>
            {/* Collage de portadas */}
            <div className="trending-list-card__collage">
              {list.covers.map((cover, idx) => (
                <img
                  key={idx}
                  src={cover}
                  alt={`Portada ${idx + 1}`}
                  className="trending-list-card__collage-img"
                  loading="lazy"
                />
              ))}
            </div>

            {/* Cuerpo de la card */}
            <div className="trending-list-card__body">
              <h3 className="trending-list-card__title">{list.title}</h3>

              <div className="trending-list-card__author">
                <span
                  className="trending-list-card__avatar"
                  style={{ backgroundColor: list.authorColor }}
                >
                  {list.author.charAt(0).toUpperCase()}
                </span>
                <span className="trending-list-card__username">@{list.author}</span>
              </div>

              <p className="trending-list-card__description">{list.description}</p>

              <div className="trending-list-card__footer">
                <div className="trending-list-card__stats">
                  <span className="trending-list-card__stat">
                    <Music size={14} />
                    {list.albumCount} álbumes
                  </span>
                  <span className="trending-list-card__stat">
                    <Heart size={14} />
                    {list.likes.toLocaleString()}
                  </span>
                  <span className="trending-list-card__stat">
                    <MessageCircle size={14} />
                    {list.comments}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
