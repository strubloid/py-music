import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Plus, Music } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProgressions, deleteProgression } from '../../services/api';
import './MySongsPage.css';

const MySongsPage = () => {
  const { isLoggedIn, promptLogin } = useAuth();
  const navigate = useNavigate();
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // For music sheet preview

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

  // Parse progression data
  const parseProgression = (p) => {
    const chords = typeof p.chords_json === 'string' ? JSON.parse(p.chords_json) : (p.chords_json || []);
    const lyrics = typeof p.lyrics_json === 'string' ? JSON.parse(p.lyrics_json) : (p.lyrics_json || {});
    const chordOverLyrics = typeof p.chord_over_lyrics_json === 'string' 
      ? JSON.parse(p.chord_over_lyrics_json) 
      : (p.chord_over_lyrics_json || {});
    return { chords, lyrics, chordOverLyrics };
  };

  // Get words from lyric text
  const getWords = (text) => {
    if (!text) return [];
    const regex = /"([^"]+)"|\S+/g;
    const words = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push(match[1] || match[0]);
    }
    return words;
  };

  // Render music sheet preview for a progression
  const renderMusicSheetPreview = (p) => {
    const { chords, lyrics, chordOverLyrics } = parseProgression(p);
    const lineCount = Object.keys(lyrics).length || 1;
    
    return (
      <div className="music-sheet-preview">
        <div className="preview-header">
          <Music size={14} />
          <span>Music Sheet Preview</span>
        </div>
        <div className="preview-lines">
          {Array.from({ length: lineCount }, (_, lineIndex) => {
            const lyricText = lyrics[lineIndex] || '';
            const words = getWords(lyricText);
            const lineChords = chordOverLyrics[lineIndex] || [];
            
            // Build chord map
            const chordMap = {};
            lineChords.forEach(({ wordIndex, chord }) => {
              chordMap[wordIndex] = chord;
            });

            if (!lyricText.trim()) {
              return (
                <div key={lineIndex} className="preview-line empty">
                  <span className="preview-empty-hint">Line {lineIndex + 1}: No lyrics</span>
                </div>
              );
            }

            return (
              <div key={lineIndex} className="preview-line">
                <div className="preview-chord-row">
                  {words.map((word, wordIndex) => {
                    const chord = chordMap[wordIndex];
                    return (
                      <span key={wordIndex} className={`preview-chord-slot ${chord ? 'has-chord' : ''}`}>
                        {chord || ''}
                      </span>
                    );
                  })}
                </div>
                <div className="preview-lyric-row">
                  {words.join(' ')}
                </div>
              </div>
            );
          })}
        </div>
        {chords.length > 0 && (
          <div className="preview-summary">
            {chords.length} chord{chords.length !== 1 ? 's' : ''} · {Object.values(chordOverLyrics).flat().length} placed
          </div>
        )}
      </div>
    );
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
            const { chords, lyrics, chordOverLyrics } = parseProgression(p);
            const hasLyrics = Object.values(lyrics).some(t => t && t.trim());
            const placedChords = Object.values(chordOverLyrics).flat().length;
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id} className={`song-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="song-meta">
                  <span className="song-key">{p.key}</span>
                  <span className="song-interval">{p.interval}</span>
                  {hasLyrics && <span className="song-lyrics-badge">Lyrics</span>}
                  {placedChords > 0 && <span className="song-sheet-badge">Sheet</span>}
                  <span className="song-date">{formatDate(p.created_at)}</span>
                </div>
                <h3 className="song-name">{p.name}</h3>
                
                <div className="song-chords">
                  {chords.length > 0 ? chords.slice(0, 6).join(' → ') : <em>No chords</em>}
                  {chords.length > 6 && <span> +{chords.length - 6} more</span>}
                </div>

                {hasLyrics && (
                  <div className="song-lyrics-preview">
                    {Object.values(lyrics).filter(t => t.trim()).slice(0, 2).join(' / ')}
                  </div>
                )}

                <div className="song-actions">
                  <button
                    className="song-load"
                    onClick={() => navigate(`/create/progressions?load=${p.id}`)}
                  >
                    Load
                  </button>
                  {hasLyrics && (
                    <button
                      className="song-preview"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                  )}
                  <button
                    className="song-delete"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? '...' : 'Delete'}
                  </button>
                </div>

                {isExpanded && hasLyrics && renderMusicSheetPreview(p)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySongsPage;
