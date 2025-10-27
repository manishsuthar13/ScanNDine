import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import Staff from './pages/Staff';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin" element={<Admin />} /> 
        <Route path="/staff" element={<Staff />} />
      </Routes>
    </Router>
  );
}

export default App;