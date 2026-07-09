import { Routes, Route } from 'react-router-dom';
import { Home } from '../features/home/Home';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Other routes like /login, /signup will go here later */}
    </Routes>
  );
};
