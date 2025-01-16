import React, { useState } from 'react';
import ArtworkDashboard from './components/artwork/ArtworkDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');

  // Render home page with navigation
  const renderHome = () => (
    <div className="home-container">
      <h1>NW Custom Apparel Management</h1>
      <div className="nav-cards">
        <div 
          className="nav-card"
          onClick={() => setCurrentView('employees')}
        >
          <div className="nav-card-icon">👥</div>
          <h2>Employee Directory</h2>
          <p>Manage employee information and departments</p>
        </div>
        <div 
          className="nav-card"
          onClick={() => setCurrentView('artwork')}
        >
          <div className="nav-card-icon">🎨</div>
          <h2>Artwork Dashboard</h2>
          <p>Track artwork status and manage designs</p>
        </div>
      </div>
    </div>
  );

  // Header with navigation
  const renderHeader = () => (
    <header className="app-header">
      <button 
        className="home-button"
        onClick={() => setCurrentView('home')}
      >
        Home
      </button>
      <h1>{currentView === 'employees' ? 'Employee Directory' : 'Artwork Dashboard'}</h1>
      <button 
        className="switch-button"
        onClick={() => setCurrentView(currentView === 'employees' ? 'artwork' : 'employees')}
      >
        Switch to {currentView === 'employees' ? 'Artwork' : 'Employees'}
      </button>
    </header>
  );

  // Main content
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHome();
      case 'employees':
        return (
          <>
            {renderHeader()}
            <div className="coming-soon">Employee Directory Coming Soon</div>
          </>
        );
      case 'artwork':
        return (
          <>
            {renderHeader()}
            <ArtworkDashboard />
          </>
        );
      default:
        return renderHome();
    }
  };

  return (
    <div className="app">
      {renderContent()}
    </div>
  );
}

export default App;
