import React from 'react';
import { Train } from 'lucide-react';
import './EarTraining.css';

const EarTraining = () => {
  return (
    <div className="ear-page">
      <div className="ear-header">
        <Train className="ear-icon" size={28} />
        <h1>Ear Training</h1>
      </div>
      <div className="placeholder-card">
        <p>🎧 Listen to a chord and guess its Roman numeral in the key of C Major.</p>
        <p className="coming-soon">Coming soon — practice identifying chord qualities by ear.</p>
      </div>
    </div>
  );
};

export default EarTraining;
