import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressions, deleteProgression } from '../../services/api';
import './MySongsPage.css';

const MySongsPage = () => {
  const { isLoggedIn, promptLogin } = useAuth();
  const navigate = useNavigate();
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadProgressions = useCallback(async () => {
    if (!isLoggedIn) {
      // Load from localStorage
      try {
        const saved = localStorage.getItem('guestProgressions');
        setProgressions(saved ? JSON.parse(saved) : []);
      } catch {
        setProgressions([]);
      }
      setLoading(false);
      return;
    }
    try {
      const res = await getProgressions();
      setProgressions(res.data.progressions || []);
    } catch {
      setProgressions([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadProgressions();
  }, [loadProgressions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this progression?')) return;
    setDeletingId(id);
    if (!isLoggedIn) {
      const saved = JSON.parse(localStorage.getItem('guestProgressions') || '[]');
      const updated = saved.filter(p => p.id !== id);
      localStorage.setItem('guestProgressions', JSON.stringify(updated));
      setProgressions(updated);
    } else {
      await deleteProgression(id);
      setProgressions(prev => prev.filter(p => p.id !== id));
    }
    setDeletingId(null);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="mysongs-page">
      <div className="mysongs-header">
        <div className="header-row">
          <ListMusic className="page-icon" size={24} />
          <h1>My Songs</h1>
        </div>
        {!isLoggedIn && (
          <p className="guest-notice">
            You're in guest mode.{' '}
            <button onClick={() => promptLogin('save')}>Sign up free</button> to sync across devices.
          </p>
        )}
        <button className="new-btn" onClick={() => navigate('/create/progressions')}>
          <Plus size={16} /> New Progression
        </button>
      </div>

      {loading && <div className="loading-state">Loading...</div>}

      {!loading && progressions.length === 0 && (
        <div className="empty-state">
          <p>No progressions saved yet.</p>
          <button onClick={() => navigate('/create/progressions')}>Create your first one</button>
        </div>
      )}

      {!loading && progressions.length > 0 && (
        <div className="songs-grid">
          {progressions.map(p => {
            const chords = typeof p.chords_json === 'string' ? JSON.parse(p.chords_json) : (p.chords_json || []);
            return (
              <div key={p.id} className="song-card">
                <div className="song-meta">
                  <span className="song-key">{p.key}</span>
                  <span className="song-interval">{p.interval}</span>
                  <span className="song-date">{formatDate(p.created_at)}</span>
                </div>
                <h3 className="song-name">{p.name}</h3>
                <div className="song-chords">
                  {chords.length > 0 ? chords.join(' → ') : <em>No chords</em>}
                </div>
                <div className="song-actions">
                  <button
                    className="song-load"
                    onClick={() => navigate(`/create/progressions?load=${p.id}`)}
                  >
                    Load
                  </button>
                  <button
                    className="song-delete"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySongsPage;
