import Leaderboard from "./components/Leaderboard";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Leaderboard />
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Leaderboard from "./Leaderboard"; // adjust path if in another folder
import Donate from "./Donate"; // or './pages/Donate' if organized that way

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/donate" element={<Donate />} />
      </Routes>
    </Router>
  );
}

export default App;