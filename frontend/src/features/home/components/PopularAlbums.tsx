import './_popular-albums.scss';

// Mock data for the albums
const MOCK_ALBUMS = [
  { id: 1, title: 'CONFESSIONS II', artist: 'Madonna', cover: 'https://placehold.co/150x150/111/444?text=Album+1' },
  { id: 2, title: 'you seem pretty sa...', artist: 'Olivia Rodrigo', cover: 'https://placehold.co/150x150/111/444?text=Album+2' },
  { id: 3, title: 'Blonde', artist: 'Frank Ocean', cover: 'https://placehold.co/150x150/111/444?text=Album+3' },
  { id: 4, title: 'The Dark Side of th...', artist: 'Pink Floyd', cover: 'https://placehold.co/150x150/111/444?text=Album+4' },
  { id: 5, title: 'OK Computer', artist: 'Radiohead', cover: 'https://placehold.co/150x150/111/444?text=Album+5' },
  { id: 6, title: 'xperiment', artist: 'Ken Carson', cover: 'https://placehold.co/150x150/111/444?text=Album+6' },
  { id: 7, title: 'In Rainbows', artist: 'Radiohead', cover: 'https://placehold.co/150x150/111/444?text=Album+7' }
];

export const PopularAlbums = () => {
  return (
    <section className="popular-albums">
      <div className="popular-albums__container">
        <h2 className="popular-albums__title">Popular Esta Semana</h2>
        
        <div className="popular-albums__grid">
          {MOCK_ALBUMS.map((album) => (
            <div key={album.id} className="album-card">
              <div className="album-card__cover">
                <img src={album.cover} alt={album.title} />
              </div>
              <div className="album-card__info">
                <h3 className="album-card__title">{album.title}</h3>
                <p className="album-card__artist">{album.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
