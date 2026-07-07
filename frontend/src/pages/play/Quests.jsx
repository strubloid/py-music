import React from 'react';
import { Gamepad2 } from 'lucide-react';
import './Quests.css';

const Quests = () => {
  return (
    <div className="quests-page">
      <div className="quests-header">
        <Gamepad2 className="quests-icon" size={28} />
        <h1>Quests</h1>
      </div>
      <div className="placeholder-card">
        <p>🏆 Complete guided challenges to earn XP and unlock new scales and modes.</p>
        <p className="coming-soon">Coming soon — chord progression quests, fretboard mastery challenges, and more.</p>
      </div>
    </div>
  );
};

export default Quests;
