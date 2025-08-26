import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export function Dashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Color by Numbers</h1>
        <div className="user-info">
          <img 
            src={currentUser.profilePic || '/default-avatar.png'} 
            alt="Profile" 
            className="profile-pic"
          />
          <span>Welcome, {currentUser.displayName}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome to your coloring adventure!</h2>
          <p>Select a picture from the gallery below to start coloring.</p>
        </div>

        <div className="gallery-section">
          <h3>Featured Coloring Pages</h3>
          <div className="gallery-grid">
            <div className="gallery-item">
              <div className="image-placeholder">Butterfly</div>
              <p>Butterfly Garden</p>
            </div>
            <div className="gallery-item">
              <div className="image-placeholder">Mandala</div>
              <p>Intricate Mandala</p>
            </div>
            <div className="gallery-item">
              <div className="image-placeholder">Landscape</div>
              <p>Mountain Landscape</p>
            </div>
            <div className="gallery-item">
              <div className="image-placeholder">Animals</div>
              <p>Jungle Animals</p>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Your Recent Activity</h3>
          <p>You haven't colored any pages yet. Start by selecting one from the gallery!</p>
        </div>
      </main>
    </div>
  );
}