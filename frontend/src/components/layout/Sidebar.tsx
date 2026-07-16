import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Music,
  BookOpen,
  Zap,
  Gamepad2,
  ListMusic,
  FolderOpen,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Train,
  LogIn,
  LogOut,
  Compass,
  FlaskConical,
} from 'lucide-react'
import UserBadge from '../auth/UserBadge'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.scss'

const NEW_SONGS_KEY = 'newSongsCount'

const NavItemWithBadge = ({ collapsed, navigate }) => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  const [badge, setBadge] = useState(0)

  useEffect(() => {
    if (location.pathname === '/create/my-songs') {
      setBadge(0)
      localStorage.setItem(NEW_SONGS_KEY, '0')
    }
  }, [location.pathname])

  useEffect(() => {
    setBadge(parseInt(localStorage.getItem(NEW_SONGS_KEY) || '0', 10))
  }, [])

  return (
    <button
      className={`nav-item ${isActive('/create/my-songs') ? 'active' : ''}`}
      onClick={() => navigate('/create/my-songs')}
      title={collapsed ? 'My Songs' : undefined}
    >
      <span className="nav-icon">
        <FolderOpen size={18} />
      </span>
      {!collapsed && <span className="nav-label">My Songs</span>}
      {badge > 0 && <span className="new-songs-badge">{badge > 9 ? '9+' : badge}</span>}
    </button>
  )
}

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, promptLogin, logout } = useAuth()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navItem = (icon, label, path) => (
    <button
      className={`nav-item ${isActive(path) ? 'active' : ''}`}
      onClick={() => navigate(path)}
      title={collapsed ? label : undefined}
    >
      <span className="nav-icon">{icon}</span>
      {!collapsed && <span className="nav-label">{label}</span>}
    </button>
  )

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <Music className="logo-icon" size={22} />
        {!collapsed && <span className="logo-text">Strubloid</span>}
      </div>

      {/* User badge */}
      <div className="sidebar-user">
        <UserBadge collapsed={collapsed} />
      </div>

      {/* Learn section */}
      <div className="nav-section">
        {!collapsed && <span className="nav-section-label">Learn</span>}
        {navItem(<BookOpen size={18} />, 'Scales', '/learn/scales')}
        {navItem(<ListMusic size={18} />, 'Chords', '/learn/chords')}
      </div>

      {/* Play section */}
      <div className="nav-section">
        {!collapsed && <span className="nav-section-label">Play</span>}
        {navItem(<Zap size={18} />, 'Challenges', '/play/daily')}
        {navItem(<Train size={18} />, 'Ear Training', '/play/ear-training')}
        {navItem(<Compass size={18} />, 'Scale Path', '/play/scales')}
        {navItem(<FlaskConical size={18} />, 'Scale Lab', '/play/learn-scales')}
        {navItem(<Gamepad2 size={18} />, 'Quests', '/play/quests')}
      </div>

      {/* Create section */}
      <div className="nav-section">
        {!collapsed && <span className="nav-section-label">Create</span>}
        <NavItemWithBadge collapsed={collapsed} navigate={navigate} />
      </div>

      {/* Settings */}
      <div className="nav-section nav-section-bottom">
        {!collapsed && <span className="nav-section-label">System</span>}
        {navItem(<BarChart2 size={18} />, 'Stats', '/stats')}
        {navItem(<Settings size={18} />, 'Settings', '/settings')}
        {!user && (
          <button
            type="button"
            className={`nav-item login-nav-item ${collapsed ? 'justify-center' : ''}`}
            onClick={() => promptLogin('save')}
            title={collapsed ? 'Sign in / Register' : undefined}
          >
            <span className="nav-icon">
              <LogIn size={18} />
            </span>
            {!collapsed && <span className="nav-label">Sign in / Register</span>}
          </button>
        )}
        {isLoggedIn ? (
          <button
            className={`nav-item logout-nav-item ${collapsed ? 'justify-center' : ''}`}
            onClick={logout}
            title={collapsed ? 'Sign out' : undefined}
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>
            {!collapsed && <span className="nav-label">Sign out</span>}
          </button>
        ) : user ? (
          <button
            type="button"
            className={`nav-item login-nav-item ${collapsed ? 'justify-center' : ''}`}
            onClick={() => promptLogin('save')}
            title={collapsed ? 'Sign in / Register' : undefined}
          >
            <span className="nav-icon">
              <LogIn size={18} />
            </span>
            {!collapsed && <span className="nav-label">Sign in / Register</span>}
          </button>
        ) : null}
      </div>

      {/* Collapse toggle */}
      <button className="collapse-toggle" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}

export default Sidebar
