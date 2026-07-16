import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ListMusic, BookOpen, ArrowRight, Sparkles, Flame, Music2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGameProgress } from '../contexts/GameProgressContext'
import './Dashboard.scss'

const Dashboard = () => {
  const { user, isLoggedIn, promptLogin } = useAuth()
  const { levelMeta, progressState } = useGameProgress()
  const navigate = useNavigate()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>The practice room</span>
          </div>
          <h1 className="greeting">
            {getGreeting()}
            {user ? `, ${user.username}` : ''}
          </h1>
          <p className="hero-sub">
            Explore scales, build progressions, and keep the learning loop moving with immediate feedback.
          </p>

          <div className="hero-actions">
            <button className="hero-action primary" onClick={() => navigate('/learn/scales')}>
              <BookOpen size={18} />
              <span>Explore scales</span>
              <ArrowRight size={16} />
            </button>
            <button className="hero-action secondary" onClick={() => navigate('/create/my-songs')}>
              <Music2 size={18} />
              <span>Open my songs</span>
            </button>
          </div>
        </div>

        <div className="hero-status">
          <div className="status-tile accent">
            <span className="status-label">Level</span>
            <strong>{isLoggedIn ? user.level : 1}</strong>
            <span className="status-note">{levelMeta.title}</span>
          </div>
          <div className="status-tile">
            <span className="status-label">XP</span>
            <strong>{isLoggedIn ? user.xp : 0}</strong>
            <span className="status-note">Progress that sticks</span>
          </div>
          <div className="status-tile">
            <span className="status-label">Mode</span>
            <strong>{isLoggedIn ? 'Synced' : 'Guest'}</strong>
            <span className="status-note">{progressState.focusPoints} focus ready</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-copy">
          <h2>What do you want to do next?</h2>
          <p>Jump into a focused practice loop or continue a creative task.</p>
        </div>

        <div className="dashboard-grid">
          <button className="dash-card featured" onClick={() => navigate('/learn/scales')}>
            <div className="card-icon-wrap">
              <BookOpen size={22} className="card-icon" />
            </div>
            <div className="card-copy">
              <h3>Explore scales</h3>
              <p>See notes, shapes, and chord context in every key.</p>
            </div>
            <span className="card-cta">
              Start learning <ArrowRight size={14} />
            </span>
          </button>

          <button className="dash-card" onClick={() => navigate('/create/progressions')}>
            <ListMusic size={22} className="card-icon" />
            <h3>Build progressions</h3>
            <p>Create and save chord loops for songwriting.</p>
          </button>

          <button className="dash-card" onClick={() => navigate('/play/daily')}>
            <Zap size={22} className="card-icon" />
            <h3>Take a challenge</h3>
            <p>Practice with quick prompts and earn XP.</p>
          </button>

          <button className="dash-card" onClick={() => navigate('/play/ear-training')}>
            <Flame size={22} className="card-icon" />
            <h3>Ear training run</h3>
            <p>Use powers, protect combo, and sharpen interval recognition.</p>
          </button>

          <button className="dash-card subtle" onClick={() => promptLogin('save')}>
            <Flame size={22} className="card-icon" />
            <h3>{isLoggedIn ? 'Keep your streak' : 'Sign in to save'}</h3>
            <p>{isLoggedIn ? 'Return tomorrow and keep momentum alive.' : 'Unlock synced progress and saved work.'}</p>
          </button>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
