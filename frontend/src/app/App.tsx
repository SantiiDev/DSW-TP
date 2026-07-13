import { Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '../features/home/Home';
import { Login } from '../features/user/pages/Login';
import { Signup } from '../features/user/pages/Signup';

export const App = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="fade-in">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
};
