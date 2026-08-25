// Punto de entrada de la feature genre: lo que el resto de la app puede importar.
// Así una pantalla de otra feature (por ejemplo el panel de administración) no
// necesita conocer la estructura interna de carpetas de esta.
export { GenreAdminSection } from './components/GenreAdminSection';
export { GenreForm } from './components/GenreForm';
export { GenreAlbumList } from './components/GenreAlbumList';
export { AlbumCover } from './components/AlbumCover';
export { GenreDetailPage } from './pages/GenreDetailPage';
export { genreService } from './services/genreService';
export { Genre, GenreAlbum, GenreAlbumArtist } from './models/Genre';
export type { GenreApiResponse, ContentState } from './models/Genre';
export type { GenreInput, GenreFilters } from './services/genreService';
export type { AlbumView } from './components/GenreAlbumList';
export type { YearMode } from './components/GenreFilters';
