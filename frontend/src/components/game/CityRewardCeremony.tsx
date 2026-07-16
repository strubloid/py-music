import React from 'react';
import { Gift, Sparkles, Star } from 'lucide-react';
import PipCharacter from '../../game/characters/PipCharacter';
import './CityRewardCeremony.scss';

const CityRewardCeremony = ({ reward, onClose }) => {
  if (!reward) return null;
  const payload = reward.payload || {};
  const isQuestVault = reward.type === 'quest-vault';
  return (
    <div className="city-reward-overlay" role="presentation" onClick={onClose}>
      <section className="city-reward" role="dialog" aria-modal="true" aria-labelledby="city-reward-title" onClick={(event) => event.stopPropagation()}>
        <div className="city-reward__rays" aria-hidden="true" />
        <PipCharacter state="reward" className="city-reward__pip" />
        <p><Sparkles size={16} /> {isQuestVault ? 'Quest Vault reward' : 'Attempt Trail reward'}</p>
        <div className="city-reward__chest"><Gift size={38} /></div>
        <h2 id="city-reward-title">{payload.name || 'Music City reward'}</h2>
        <strong>{payload.attempts ? `${payload.attempts} active plays` : payload.xp ? `+${payload.xp} XP secured` : 'New discovery'}</strong>
        {payload.message && <blockquote>{payload.message}</blockquote>}
        {payload.badge && <span><Star size={15} /> Badge: {payload.badge}</span>}
        {payload.cosmetic && <span>Unlocked: {payload.cosmetic}</span>}
        {payload.focus > 0 && <span>+{payload.focus} Focus</span>}
        <button type="button" onClick={onClose}>Keep exploring</button>
      </section>
    </div>
  );
};

export default CityRewardCeremony;
