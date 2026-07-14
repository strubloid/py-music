import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { LogOut, User, ChevronDown, Music, Flame } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGameProgress } from '../../contexts/GameProgressContext.jsx';
import { getUserStreak } from '../../services/api';
import './UserBadge.scss';

const XP_PER_LEVEL = 500;
const GUEST_SONGS_KEY = 'guestSongs';
const STREAK_KEY = 'streakData';

// Load streak data from localStorage (fallback for guests)
const loadGuestStreak = () => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastVisit: null };
};

// Save + update streak for guest users only
const updateGuestStreak = () => {
  const data = loadGuestStreak();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (data.lastVisit === today) {
    return data.count;
  }

  const newCount = data.lastVisit === yesterday ? data.count + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastVisit: today }));
  return newCount;
};

const UserBadge = ({ collapsed = false }) => {
  const { user, logout, isLoggedIn, isGuest, promptLogin } = useAuth();
  const { levelMeta, progressState, rankMeta } = useGameProgress();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [streak, setStreak] = useState(0);

  const refreshStreak = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const res = await getUserStreak();
        setStreak(res.data.streak);
      } catch {
        // keep the last known value if the backend call fails
      }
    } else {
      setStreak(updateGuestStreak());
    }
  }, [isLoggedIn]);

  // Guest song count from localStorage
  const songCount = useMemo(() => {
    try {
      const raw = localStorage.getItem(GUEST_SONGS_KEY);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  }, []);

  // Streak: backend for logged-in, localStorage for guests.
  // Refresh on route changes and whenever a challenge page broadcasts an update.
  useEffect(() => {
    refreshStreak();
  }, [refreshStreak, location.pathname]);

  useEffect(() => {
    const handleStreakUpdated = () => refreshStreak();
    window.addEventListener('streak:updated', handleStreakUpdated);
    window.addEventListener('focus', handleStreakUpdated);
    return () => {
      window.removeEventListener('streak:updated', handleStreakUpdated);
      window.removeEventListener('focus', handleStreakUpdated);
    };
  }, [refreshStreak]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const xpProgress = levelMeta.progressInLevel;
  const nextLevelXp = levelMeta.nextLevelXp;

  return (
    <div className={`user-badge ${collapsed ? 'collapsed' : ''}`} ref={ref}>
      <button className={`badge-trigger ${collapsed ? 'collapsed' : ''}`} onClick={() => setOpen(!open)}>
        <div className="badge-avatar">
          {isLoggedIn ? (
            <User size={16} />
          ) : (
            <span className="guest-avatar">G</span>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="badge-info">
              <span className="badge-name">{user.username}</span>
              <span className="badge-level">{rankMeta.name} · Lv. {rankMeta.level}/{rankMeta.levels}</span>
            </div>
            <div className="badge-xp-ring">
              <svg viewBox="0 0 36 36">
                <circle className="xp-bg" cx="18" cy="18" r="15.5" />
                <circle
                  className="xp-fill"
                  cx="18" cy="18" r="15.5"
                  strokeDasharray={`${xpProgress}, 100`}
                />
              </svg>
            </div>
          </>
        )}
        {!collapsed && <ChevronDown size={14} className={`badge-chevron ${open ? 'open' : ''}`} />}
      </button>

      {open && (
        <div className="badge-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-rank">
              <span>{rankMeta.name}</span>
              <strong>{rankMeta.progressLabel}</strong>
            </div>
            <div className="rank-bar" aria-label={`${rankMeta.name} rank progress: ${rankMeta.progressPercent}%`}>
              <div className="rank-bar-fill" style={{ width: `${rankMeta.progressPercent}%` }} />
            </div>
            <div className="dropdown-xp">
              <span className="xp-label">XP</span>
              <span className="xp-value">{user.xp} / {nextLevelXp}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="dropdown-stats">
            <div className="stat-item">
              <Flame size={14} className="stat-icon streak-icon" />
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak} {streak === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="stat-item">
              <Music size={14} className="stat-icon songs-icon" />
              <span className="stat-label">Focus</span>
              <span className="stat-value">{progressState.focusPoints}</span>
            </div>
          </div>

          <div className="badge-meta-row">
            <span>{progressState.badges.length} badges</span>
            <span>{songCount} songs</span>
          </div>

          {isGuest ? (
            <button
              type="button"
              className="dropdown-item"
              onClick={() => { setOpen(false); promptLogin('save'); }}
            >
              <User size={15} />
              Sign in to save progress
            </button>
          ) : (
            <>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item danger"
                onClick={() => { setOpen(false); logout(); }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserBadge;
