import React from 'react';
import { Settings, User, Mail, Shield, Music } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Settings.css';

const INSTRUMENTS = [
  { id: 'guitar', label: 'Guitar' },
  { id: 'piano', label: 'Piano' },
  { id: 'both', label: 'Both' },
];

const SettingsPage = () => {
  const { user, updatePreferences } = useAuth();

  const handleInstrumentChange = async (e) => {
    const val = e.target.value;
    try {
      await updatePreferences({ instrument_preference: val });
    } catch {
      // silently fail — backend will validate
    }
  };

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
            <User size={16} />
            Username
          </span>
          <span className="setting-val">{user?.username || '—'}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">
            <Mail size={16} />
            Email
          </span>
          <span className="setting-val">{user?.email || '—'}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">
            <Shield size={16} />
            Account type
          </span>
          <span className="setting-val">
            {user?.id ? 'Signed in' : 'Guest'}
          </span>
        </div>
      </div>

      <div className="settings-group">
        <h3>Defaults</h3>
        <div className="setting-row">
          <span className="setting-label">
            <Music size={16} />
            Instrument
          </span>
          <select
            className="setting-select"
            value={user?.instrument_preference || ''}
            onChange={handleInstrumentChange}
            disabled={!user?.id}
          >
            <option value="" disabled>Select default instrument</option>
            {INSTRUMENTS.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.label}</option>
            ))}
          </select>
        </div>
        <p className="setting-hint">
          {user?.id
            ? 'Your default instrument is used in ear training and chord diagrams.'
            : 'Sign in to set your default instrument preference.'}
        </p>
      </div>

      <div className="settings-group">
        <h3>Display</h3>
        <div className="setting-row">
          <span>Note naming</span>
          <span className="setting-val">Sharps</span>
        </div>
        <div className="setting-row">
          <span>Chord display</span>
          <span className="setting-val">Ascendo</span>
        </div>
      </div>
      <p className="more-soon">More settings coming soon.</p>
    </div>
  );
};

export default SettingsPage;
