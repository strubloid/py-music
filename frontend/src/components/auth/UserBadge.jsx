import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Star, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './UserBadge.css';

const XP_PER_LEVEL = 500;

const UserBadge = () => {
  const { user, logout, isLoggedIn, isGuest, promptLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const xpInLevel = user.xp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;

  const level = user.level || 1;

  return (
    <div className="user-badge" ref={ref}>
      <button className="badge-trigger" onClick={() => setOpen(!open)}>
        <div className="badge-avatar">
          {isLoggedIn ? (
            <User size={16} />
          ) : (
            <span className="guest-avatar">G</span>
          )}
        </div>
        <div className="badge-info">
          <span className="badge-name">{user.username}</span>
          <span className="badge-level">Lv. {level}</span>
        </div>
        <div className="badge-xp-ring" style={{ '--progress': xpProgress }}>
          <svg viewBox="0 0 36 36">
            <circle className="xp-bg" cx="18" cy="18" r="15.5" />
            <circle
              className="xp-fill"
              cx="18" cy="18" r="15.5"
              strokeDasharray={`${xpProgress}, 100`}
            />
          </svg>
        </div>
        <ChevronDown size={14} className={`badge-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="badge-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-xp">
              <span className="xp-label">XP</span>
              <span className="xp-value">{user.xp} / {XP_PER_LEVEL * level}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>

          {isGuest ? (
            <button className="dropdown-item" onClick={() => { setOpen(false); promptLogin(); }}>
              <User size={15} />
              Sign in to save progress
            </button>
          ) : (
            <>
              <button className="dropdown-item">
                <Star size={15} />
                Favorites
              </button>
              <button className="dropdown-item">
                <Settings size={15} />
                Settings
              </button>
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
