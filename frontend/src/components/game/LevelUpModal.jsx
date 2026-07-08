import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import './LevelUpModal.css';

const LevelUpModal = ({ levelUpState, onClose }) => {
  if (!levelUpState) return null;

  return (
    <div className="levelup-overlay" role="presentation" onClick={onClose}>
      <div className="levelup-modal" role="dialog" aria-modal="true" aria-labelledby="levelup-title" onClick={(event) => event.stopPropagation()}>
        <div className="levelup-badge">
          <Sparkles size={18} />
          Level Up!
        </div>
        <h2 id="levelup-title">Level {levelUpState.level}</h2>
        <p className="levelup-title">{levelUpState.title}</p>
        <p className="levelup-copy">Your ear just opened a new lane. Keep the streak alive and try the newly unlocked tools.</p>

        {levelUpState.unlockedPowers?.length > 0 && (
          <div className="levelup-unlocks">
            <span>Unlocked power</span>
            <strong>{levelUpState.unlockedPowers.map((power) => power.name).join(', ')}</strong>
          </div>
        )}

        <div className="levelup-footer">
          <div className="levelup-reward">
            <Trophy size={16} />
            <span>Focus restored</span>
          </div>
          <button type="button" className="levelup-action" onClick={onClose}>Keep training</button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
