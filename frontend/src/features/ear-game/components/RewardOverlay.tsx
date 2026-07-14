import React, { useState } from 'react';
import { ChevronRight, Crown, Gift, Sparkles, Trophy } from 'lucide-react';

const RewardOverlay = ({ accuracy, game, rankEvent, rankMeta, onContinue }) => {
  const [skip, setSkip] = useState(false);
  const rankUp = rankEvent?.type === 'rank-up';
  const perfect = accuracy === 100;
  const title = rankUp ? `${rankEvent.rank} unlocked` : perfect ? 'Perfect sound run' : accuracy >= 80 ? 'Gate run complete' : 'Run archived';
  const reward = rankUp ? 'Rank crest added to your profile' : perfect ? 'Perfect-run signal captured' : `${game.correctCount} sound gates crossed`;
  return <section className={`reward-overlay ${skip ? 'reward-overlay--skipped' : ''}`} data-reward-type={rankUp ? 'rank-up' : perfect ? 'perfect-run' : 'run-complete'} aria-labelledby="reward-title">
    <div className="reward-overlay__rays" aria-hidden="true" />
    <div className="reward-overlay__capsule" aria-hidden="true"><Gift /><span>♪</span></div>
    <p>{rankUp ? 'RANK PROMOTION' : perfect ? 'PERFECT FREQUENCY' : 'RUN COMPLETE'}</p>
    <h1 id="reward-title">{title}</h1>
    <div className="reward-overlay__stats"><span><Trophy /> {game.score.toLocaleString()} score</span><span><Crown /> {accuracy}% accuracy</span><span><Sparkles /> {game.maxCombo}x peak combo</span></div>
    <strong>{reward}</strong>
    <small>{rankEvent?.type === 'challenge-unlocked' ? 'Your next run opens with a harmonic guardian.' : `${rankMeta.name} · ${rankMeta.progressLabel}`}</small>
    <div className="reward-overlay__actions"><button type="button" onClick={() => setSkip(true)}>{skip ? 'Animation skipped' : 'Skip animation'}</button><button type="button" onClick={onContinue}>Run again <ChevronRight /></button></div>
  </section>;
};

export default React.memo(RewardOverlay);
