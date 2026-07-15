// Componente raíz de la aplicación que define las rutas principales y el layout base.
import { Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '../features/home/Home';
import { Login } from '../features/user/pages/Login';
import { Signup } from '../features/user/pages/Signup';
import { MusicExplorePage } from '../features/music/pages/MusicExplorePage';
import { MembersExplorePage } from '../features/user/pages/MembersExplorePage';
import { ListsExplorePage } from '../features/review/pages/ListsExplorePage';

export const App = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="fade-in">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<MusicExplorePage />} />
        <Route path="/members" element={<MembersExplorePage />} />
        <Route path="/lists" element={<ListsExplorePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
};
