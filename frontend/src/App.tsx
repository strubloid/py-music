import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ChordPanelProvider } from './contexts/ChordPanelContext'
import Sidebar from './components/layout/Sidebar'
import LoginModal from './components/auth/LoginModal'
import ScalesPage from './pages/learn/ScalesPage'
import ChordsPage from './pages/learn/ChordsPage'
import MySongsPage from './pages/create/MySongsPage'

import Stats from './pages/system/Stats'
import Settings from './pages/system/Settings'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import { WorldTravelProvider } from './contexts/WorldTravelContext'
import './App.scss'

const PracticeSquare = lazy(() => import('./pages/PracticeSquare'))
const DailyChallenge = lazy(() => import('./pages/play/DailyChallenge'))
const EarTraining = lazy(() => import('./pages/play/EarTraining'))
const Quests = lazy(() => import('./pages/play/Quests'))
const ScalePathGame = lazy(() => import('./features/scale-play/components/ScalePathGame'))
const ScaleLab = lazy(() => import('./features/scale-play/components/ScaleLab'))

const DISTRICT_LOADING_COPY = {
  '/play/quests': ['Vault Keeper is searching for the right key…', 'Aligning mission seals and reward mechanisms.'],
  '/play/scales': ['Notes are assembling the trail bridge…', 'Placing six or seven safe musical steps.'],
  '/play/learn-scales': ['Pip is calibrating the Sound Formula table…', 'Warming the music21 analysis chamber.'],
  '/play/ear-training': ['Pip is tuning the Listening Beacon…', 'Checking the city signal before the gates open.'],
}

const DistrictLoading = () => {
  const location = useLocation()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 3000)
    return () => window.clearTimeout(timer)
  }, [])
  const copy = DISTRICT_LOADING_COPY[location.pathname] || [
    'Pip is tuning the district…',
    'Loading only the music and scenery this place needs.',
  ]
  return (
    <div className="district-loading" role="status" aria-live="polite">
      <span className="loading-notes" aria-hidden="true">
        ♪ ♫ ♪
      </span>
      <strong>{copy[0]}</strong>
      <small>{slow ? `${copy[1]} This is taking longer than usual; your route is still safe.` : copy[1]}</small>
    </div>
  )
}

class WorldErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="district-error" role="alert">
        <span aria-hidden="true">⌁ ♪</span>
        <h1>Echo lost the district signal</h1>
        <p>Pip kept your City progress safe. Reconnect this route or return to Practice Square.</p>
        <div>
          <button type="button" onClick={() => window.location.reload()}>
            Reconnect signal
          </button>
          <a href="/">Return to Practice Square</a>
        </div>
        <details>
          <summary>Technical details</summary>
          <code>{String(this.state.error?.message || this.state.error)}</code>
        </details>
      </section>
    )
  }
}

const App = () => {
  const location = useLocation()
  const isWorldRoute = location.pathname === '/' || location.pathname.startsWith('/play/')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isWorldRoute)

  useEffect(() => {
    setSidebarCollapsed(isWorldRoute)
  }, [isWorldRoute, location.pathname])

  return (
    <WorldTravelProvider>
      <div className={`app-shell ${isWorldRoute ? 'world-mode' : ''}`}>
        {/* Left sidebar */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />

        {/* Main workspace */}
        <main
          className={`workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isWorldRoute ? 'world-workspace' : ''}`}
        >
          <ChordPanelProvider>
            <WorldErrorBoundary key={location.pathname}>
              <Suspense fallback={<DistrictLoading />}>
                <Routes>
                  <Route path="/" element={<PracticeSquare />} />
                  <Route path="/learn/scales" element={<ScalesPage />} />
                  <Route path="/learn/chords" element={<ChordsPage />} />
                  <Route path="/create/progressions" element={<Navigate to="/create/my-songs" replace />} />
                  <Route path="/create/my-songs" element={<MySongsPage />} />
                  <Route path="/play/daily" element={<DailyChallenge />} />
                  <Route path="/play/ear-training" element={<EarTraining />} />
                  <Route path="/play/scales" element={<ScalePathGame />} />
                  <Route path="/play/learn-scales" element={<ScaleLab />} />
                  <Route path="/play/quests" element={<Quests />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </WorldErrorBoundary>
          </ChordPanelProvider>
        </main>

        {/* Login modal overlay — rendered at root, outside sidebar */}
        <LoginModal />
      </div>
    </WorldTravelProvider>
  )
}

export default App
