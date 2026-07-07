import React from 'react';
import { Settings } from 'lucide-react';
import './Settings.css';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <Settings className="page-icon" size={24} />
        <h1>Settings</h1>
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
