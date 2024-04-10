// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './Log';
import Homepage from './Homepage';
import AddItem from './AddItem';
import BudgetCard from './BudgetCard';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Analitics from './Analitics';
function App() {
  return (
    <GoogleOAuthProvider clientId="111569510861-ohhnmnjkae47cq7jk2o36ru2ogvbn1r9.apps.googleusercontent.com">
      <Router>
      <Routes>
        <Route path="/" element={<Log />} />
        <Route path="/Home" element={<Homepage />} />
        <Route path="/AddItem" element={<AddItem />} />
        <Route path="/Analitics" element={<Analitics />} />
      </Routes>
    </Router>
    </GoogleOAuthProvider>
    
  );
}

export default App;

