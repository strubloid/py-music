import React, { useState } from 'react'
import { Activity, Eye, Gauge, Mail, Music, Settings, Shield, User, Volume2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMotionProfile } from '../../contexts/MotionContext'
import api from '../../services/api'
import { readAudioMix, saveAudioMix, type AudioMix, type AudioMixCategory } from '../../game/audio/audioMix'
import './Settings.scss'

const INSTRUMENTS = [
  { id: 'guitar', label: 'Guitar' },
  { id: 'piano', label: 'Piano' },
  { id: 'both', label: 'Both' },
]

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const AUDIO_CATEGORIES: Array<{ id: AudioMixCategory; label: string; description: string }> = [
  { id: 'musicalPrompt', label: 'Musical prompts', description: 'Educational notes, chords, and comparisons' },
  { id: 'worldAmbience', label: 'World ambience', description: 'District arrival and environmental sound' },
  { id: 'uiFeedback', label: 'Interface feedback', description: 'Selection and navigation confirmation' },
  { id: 'foley', label: 'Character foley', description: 'Pip movement and physical world objects' },
  { id: 'reward', label: 'Reward ceremonies', description: 'Musical resolution after completion' },
  { id: 'accessibility', label: 'Accessibility cues', description: 'Non-visual state and warning cues' },
]

const SettingsPage = () => {
  const { user, updatePreferences, refreshUser } = useAuth()
  const { motion, performance, setMotion, setPerformance } = useMotionProfile()
  const [privacyStatus, setPrivacyStatus] = useState('')
  const [audioMix, setAudioMix] = useState<AudioMix>(readAudioMix)

  const handleInstrumentChange = async (event) => {
    try {
      await updatePreferences({ instrument_preference: event.target.value })
    } catch {
      // The API validates supported instruments.
    }
  }

  const handleSkillLevelChange = async (event) => {
    try {
      await updatePreferences({ skill_level: event.target.value })
    } catch {
      // The API validates supported curriculum bands.
    }
  }

  const handleAnalyticsChange = async (event) => {
    if (!user?.id) return
    setPrivacyStatus('Saving…')
    try {
      await api.patch('/api/me/privacy', { analytics_enabled: event.target.checked })
      await refreshUser()
      setPrivacyStatus('Saved')
    } catch {
      setPrivacyStatus('Could not save')
    }
  }

  const handleAudioMixChange = (category: AudioMixCategory, value: number) => {
    const next = { ...audioMix, [category]: value }
    setAudioMix(next)
    saveAudioMix(next)
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Settings className="page-icon" size={24} />
        <h1>Settings</h1>
      </div>

      <div className="settings-group">
        <h3>Account</h3>
        <div className="setting-row">
          <span className="setting-label">
            <User size={16} /> Username
          </span>
          <span className="setting-val">{user?.username || '—'}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">
            <Mail size={16} /> Email
          </span>
          <span className="setting-val">{user?.email || '—'}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">
            <Shield size={16} /> Account type
          </span>
          <span className="setting-val">{user?.id ? 'Signed in' : 'Guest'}</span>
        </div>
      </div>

      <div className="settings-group">
        <h3>Learning defaults</h3>
        <div className="setting-row">
          <span className="setting-label">
            <Music size={16} /> Instrument
          </span>
          <select
            aria-label="Default instrument"
            className="setting-select"
            value={user?.instrument_preference || ''}
            onChange={handleInstrumentChange}
            disabled={!user?.id}
          >
            <option value="" disabled>
              Select default instrument
            </option>
            {INSTRUMENTS.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.label}
              </option>
            ))}
          </select>
        </div>
        <p className="setting-hint">
          {user?.id ? 'Used when a district supports both instruments.' : 'Sign in to save an instrument preference.'}
        </p>
        <div className="setting-row">
          <span className="setting-label">
            <Shield size={16} /> Practice level
          </span>
          <select
            aria-label="Practice level"
            className="setting-select"
            value={user?.skill_level || ''}
            onChange={handleSkillLevelChange}
            disabled={!user?.id}
          >
            <option value="" disabled>
              Select practice level
            </option>
            {SKILL_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h3>World display</h3>
        <div className="setting-row">
          <span className="setting-label">
            <Activity size={16} /> World motion
          </span>
          <select
            aria-label="World motion"
            className="setting-select"
            value={motion}
            onChange={(event) => setMotion(event.target.value as 'full' | 'comfort' | 'minimal')}
          >
            <option value="full">Full</option>
            <option value="comfort">Comfort</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <p className="setting-hint">
          Minimal removes camera travel and non-essential displacement. Device reduced-motion is respected
          automatically.
        </p>
        <div className="setting-row">
          <span className="setting-label">
            <Gauge size={16} /> Graphics profile
          </span>
          <select
            aria-label="Graphics profile"
            className="setting-select"
            value={performance}
            onChange={(event) => setPerformance(event.target.value as 'high' | 'balanced' | 'low')}
          >
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="settings-group audio-mix-settings">
        <h3>
          <Volume2 size={17} /> Sound mix
        </h3>
        <p className="setting-hint">
          Educational prompts stay independent from ambience, feedback, characters, rewards, and accessibility cues.
        </p>
        {AUDIO_CATEGORIES.map((category) => (
          <div className="audio-mix-row" key={category.id}>
            <label htmlFor={`audio-${category.id}`}>
              <strong>{category.label}</strong>
              <small>{category.description}</small>
            </label>
            <input
              id={`audio-${category.id}`}
              type="range"
              min="0"
              max="100"
              step="5"
              value={Math.round(audioMix[category.id] * 100)}
              onChange={(event) => handleAudioMixChange(category.id, Number(event.target.value) / 100)}
            />
            <output htmlFor={`audio-${category.id}`}>{Math.round(audioMix[category.id] * 100)}%</output>
          </div>
        ))}
      </div>

      <div className="settings-group">
        <h3>Privacy</h3>
        <div className="setting-row">
          <span className="setting-label">
            <Eye size={16} /> Improve learning activities
          </span>
          <label className="setting-switch">
            <input
              type="checkbox"
              checked={Boolean(user?.id && user?.analytics_enabled !== false)}
              disabled={!user?.id}
              onChange={handleAnalyticsChange}
            />
            <span aria-hidden="true" />
          </label>
        </div>
        <p className="setting-hint">
          {user?.id
            ? 'Stores only the activity type, broad device settings, completion state, and coarse duration. No audio, note content, free text, email, location, advertising IDs, or cross-site tracking.'
            : 'Guest analytics stay on this device and are not uploaded.'}
        </p>
        {privacyStatus && (
          <p className="setting-status" role="status">
            {privacyStatus}
          </p>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
