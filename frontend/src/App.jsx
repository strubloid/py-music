import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Music, Piano, Guitar, CircleDot, ArrowRight, Music2 } from 'lucide-react'
import './App.css'
import KeySelector from './components/KeySelector/KeySelector'
import PianoKeyboard from './components/PianoKeyboard/PianoKeyboard'
import ScaleInfo from './components/ScaleInfo/ScaleInfo'
import ChordProgressions from './components/ChordProgressions/ChordProgressions'
import GuitarFretboard from './components/GuitarFretboard/GuitarFretboard'
import SecondaryDominants from './components/SecondaryDominants/SecondaryDominants'
import Info from './components/common/Info'
import ChordDisplaySwitch from './components/common/ChordDisplaySwitch'
import ChordsToggle from './components/common/ChordsToggle'

import BottomPanel from './components/common/BottomPanel'
import TopHeader from './components/common/TopHeader'
import { ChordDisplayProvider } from './contexts/ChordDisplayContext'
import { ChordPanelProvider } from './contexts/ChordPanelContext'



function App() {
  const [selectedKey, setSelectedKey] = useState('C')
  const [selectedInterval, setSelectedInterval] = useState('major')
  const [scaleData, setScaleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('scale')
  const [availableIntervals, setAvailableIntervals] = useState([])
  const [headerType, setHeaderType] = useState('floating') // New state for header type

  useEffect(() => {
    fetchAvailableIntervals()
  }, [])

  useEffect(() => {
    if (selectedKey && selectedInterval) {
      fetchScaleData(selectedKey, selectedInterval)
    }
  }, [selectedKey, selectedInterval])

  // This function will get the intervals avaiable from the backend API
  const fetchAvailableIntervals = async () => {
    try {
      const response = await axios.get('/api/intervals')
      setAvailableIntervals(response.data.intervals)
    } catch (err) {
      console.error('Error fetching intervals:', err)
      // Fallback to default intervals if API fails
      setAvailableIntervals([
        { key: 'major', name: 'Major' },
        { key: 'minor', name: 'Minor' }
      ])
    }
  }

  // This function fetches scale data based on selected key and interval
  const fetchScaleData = async (key, interval) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch scale data from backend API - encode the key to handle sharp symbols
      const encodedKey = encodeURIComponent(key)
      const response = await axios.get(`/api/scale/${encodedKey}?interval=${interval}`)
      setScaleData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch scale data')
      console.error('Error fetching scale data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="error-container">
            <h3 className="error-title">Error</h3>
            <p className="error-message">{error}</p>
            <button 
              onClick={() => fetchScaleData(selectedKey)}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ChordDisplayProvider>
      <ChordPanelProvider>
        <div className="app-container">
          {/* Top Header with shortcuts and controls */}
          <TopHeader type={headerType} />
          
          <div className="main-content">
            {/* Header */}
            <header className="app-header">
            <div className="header-title-container">
              <Music className="header-icon" />
              <h1 className="header-title">Strubloid</h1>
              <h1 className="header-title">#No mi mi mi ...</h1>
            </div>
            <p className="header-subtitle">
              Have fun discovering scales, chords, and progressions!
            </p>
            <div style={{ 
              margin: '1rem 0', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <label style={{ marginRight: '1rem', fontSize: '0.9rem' }}>
                Header Mode: 
              </label>
              <label style={{ marginRight: '1rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="floating" 
                  checked={headerType === 'floating'} 
                  onChange={(e) => setHeaderType(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                Floating
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="block" 
                  checked={headerType === 'block'} 
                  onChange={(e) => setHeaderType(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                Block
              </label>
            </div>
          </header>

        {/* Key and Interval Selectors - Now center positioned */}
        <div className="key-interval-section">
          <KeySelector 
            selectedKey={selectedKey} 
            onKeyChange={setSelectedKey}
            selectedInterval={selectedInterval}
            onIntervalChange={setSelectedInterval}
            availableIntervals={availableIntervals}
            loading={loading}
          />
        </div>

        {/* Info Panels Container */}
        <div className="info-panels-container">
          {/* Floating Scale Degrees Panel */}
          {scaleData && (
            <Info 
              title="Scale" 
              icon="🪜"
              side="right"
              offset={0}
              initialExpanded={false}
            >
              <div className="degrees-compact-floating">
                {scaleData.scale_degrees.map((degree, index) => (
                  <div key={index} className="degree-compact-floating">
                    <div className="degree-roman-floating">{degree.roman}</div>
                    <div className="degree-chord-floating">{degree.chord}</div>
                  </div>
                ))}
              </div>
            </Info>
          )}

          {/* Floating Scale Notes Panel */}
          {scaleData && (
            <Info 
              title="Scale Notes" 
              icon="🎶"
              side="right"
              offset={1}
              initialExpanded={false}
            >
              <div className="notes-compact-floating">
                {scaleData.notes.map((note, index) => (
                  <div
                    key={index}
                    className={`note-compact-floating ${index === 0 ? 'root-note' : ''}`}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </Info>
          )}

          {/* Floating Secondary Dominants Panel */}
          {scaleData && scaleData.chord_sevenths && (
            <Info 
              title="Secondary Dominants" 
              icon="🎢"
              side="right"
              offset={2}
              initialExpanded={false}
            >
              <div className="dominants-compact-floating">
                {scaleData.chord_sevenths.map((item, index) => {
                  const romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
                  return (
                    <div key={index} className="dominant-item-floating">
                      <div className="dominant-source">{item.seventh}</div>
                      <div className="dominant-arrow">→</div>
                      <div className="dominant-target">{item.resolves_to}</div>
                    </div>
                  )
                })}
              </div>
            </Info>
          )}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading scale analysis...</p>
          </div>
        )}

        {scaleData && (
          <>
            {/* Navigation Tabs */}
            <div className="navigation-tabs">
              <div className="tabs-container">
                {[
                  { id: 'scale', icon: Music2, label: 'Scale Info' },
                  { id: 'guitar', icon: Guitar, label: 'Guitar' },
                  { id: 'piano', icon: Piano, label: 'Piano' },
                  { id: 'progressions', icon: ArrowRight, label: 'Progressions' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`tab-button ${activeTab === id ? 'active' : ''}`}
                  >
                    <Icon className="tab-icon" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Panels */}
            <div>
              {activeTab === 'scale' && (
                <ScaleInfo scaleData={scaleData} />
              )}
              
              {activeTab === 'guitar' && (
                <GuitarFretboard fretboardData={scaleData.fretboard_data} />
              )}

              {activeTab === 'piano' && (
                <PianoKeyboard keyboardData={scaleData.keyboard_data} />
              )}
              
              {activeTab === 'progressions' && (
                <ChordProgressions 
                  progressions={scaleData.progressions}
                  keyName={scaleData.key}
                />
              )}
              

            </div>
          </>
        )}
          </div>
        </div>
        <BottomPanel scaleData={scaleData} />
      </ChordPanelProvider>
    </ChordDisplayProvider>
  )
}

export default App