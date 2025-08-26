import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './Components/Login';
import { Register } from './Components/Register';
import { ProtectedRoute } from './Components/ProtectedRoute';
import './App.css';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="dashboard">
      <header>
        <h1>Color by Numbers</h1>
        <div className="user-info">
          <span>Welcome, {currentUser.displayName}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main>
        <div className="welcome-message">
          <h2>Welcome to your coloring adventure!</h2>
          <p>Select a picture from the gallery below to start coloring.</p>
          {/* Gallery of coloring pages will go here */}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;