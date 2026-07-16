import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { GameProgressProvider } from './contexts/GameProgressContext'
import { MotionProvider } from './contexts/MotionContext'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <MotionProvider>
          <GameProgressProvider>
            <App />
          </GameProgressProvider>
        </MotionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
