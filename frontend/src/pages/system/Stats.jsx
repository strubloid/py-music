import React from 'react';
import { BarChart2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Stats.css';

const Stats = () => {
  const { user } = useAuth();

  return (
    <div className="stats-page">
      <div className="stats-header">
        <BarChart2 className="page-icon" size={24} />
        <h1>Statistics</h1>
      </div>

      {user ? (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{user.xp || 0}</span>
            <span className="stat-label">Total XP</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{user.level || 1}</span>
            <span className="stat-label">Level</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">—</span>
            <span className="stat-label">Progressions Created</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">—</span>
            <span className="stat-label">Challenges Completed</span>
          </div>
        </div>
      ) : (
        <p className="empty-text">Sign in to see your stats.</p>
      )}
    </div>
  );
};

export default Stats;
