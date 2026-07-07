import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ListMusic, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1 className="greeting">
          {getGreeting()}{user ? `, ${user.username}` : ''} 👋
        </h1>
        <p className="hero-sub">
          {isLoggedIn
            ? `Level ${user.level} · ${user.xp} XP`
            : 'Sign up to save your progress and earn XP'}
        </p>
      </div>

      <div className="dashboard-grid">
        <button className="dash-card primary" onClick={() => navigate('/learn/scales')}>
          <BookOpen size={28} className="card-icon" />
          <h2>Explore Scales</h2>
          <p>Discover scales, chords, and theory for any key</p>
        </button>

        <button className="dash-card" onClick={() => navigate('/create/progressions')}>
          <ListMusic size={28} className="card-icon" />
          <h2>Build Progressions</h2>
          <p>Create and save chord progressions</p>
        </button>

        <button className="dash-card accent" onClick={() => navigate('/play/daily')}>
          <Zap size={28} className="card-icon" />
          <h2>Daily Challenge</h2>
          <p>Earn XP and keep your streak alive</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
