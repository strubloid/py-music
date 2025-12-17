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

function App() {
  const [selectedKey, setSelectedKey] = useState('C')
  const [selectedInterval, setSelectedInterval] = useState('major')
  const [scaleData, setScaleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('scale')
  const [availableIntervals, setAvailableIntervals] = useState([])

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

  const fetchScaleData = async (key, interval) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`/api/scale/${key}?interval=${interval}`)
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
    <div className="app-container">
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-title-container">
            <Music className="header-icon" />
            <h1 className="header-title">
              Strubloid Music Theory
            </h1>
          </div>
          <p className="header-subtitle">
            Have fun discovering scales, chords, and progressions!
          </p>
        </header>

        {/* Key and Interval Selector */}
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
                  { id: 'progressions', icon: ArrowRight, label: 'Progressions' },
                  { id: 'dominants', icon: CircleDot, label: 'Dominants' }
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
              
              {activeTab === 'dominants' && (
                <SecondaryDominants 
                  chordSevenths={scaleData.chord_sevenths}
                  keyName={scaleData.key}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App