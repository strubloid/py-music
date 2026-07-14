import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { GameProgressProvider } from './contexts/GameProgressContext.jsx'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <GameProgressProvider>
          <App />
        </GameProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
