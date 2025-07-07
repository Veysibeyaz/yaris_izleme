import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PublicDashboard />} />
          <Route path="/dashboard" element={<PublicDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;