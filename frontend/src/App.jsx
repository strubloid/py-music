import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ChordPanelProvider } from './contexts/ChordPanelContext'
import Sidebar from './components/layout/Sidebar'
import LoginModal from './components/auth/LoginModal'
import Dashboard from './pages/Dashboard'
import ScalesPage from './pages/learn/ScalesPage'
import CreateProgressionsPage from './pages/create/CreateProgressionsPage'
import MySongsPage from './pages/create/MySongsPage'
import DailyChallenge from './pages/play/DailyChallenge'
import EarTraining from './pages/play/EarTraining'
import Quests from './pages/play/Quests'
import Stats from './pages/system/Stats'
import Settings from './pages/system/Settings'
import './App.css'

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-shell">
      {/* Left sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Main workspace */}
      <main className={`workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <ChordPanelProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learn/scales" element={<ScalesPage />} />
            <Route path="/learn/chords" element={<ScalesPage />} />
            <Route path="/create/progressions" element={<CreateProgressionsPage />} />
            <Route path="/create/my-songs" element={<MySongsPage />} />
            <Route path="/play/daily" element={<DailyChallenge />} />
            <Route path="/play/ear-training" element={<EarTraining />} />
            <Route path="/play/quests" element={<Quests />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChordPanelProvider>
      </main>

      {/* Login modal overlay — rendered at root, outside sidebar */}
      <LoginModal />
    </div>
  )
}

export default App
