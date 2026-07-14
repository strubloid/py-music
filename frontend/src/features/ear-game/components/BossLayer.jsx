import React from 'react';

const BossLayer = ({ correctCount, challengeCount, result }) => {
  const shield = Math.max(8, 100 - correctCount * (100 / challengeCount));
  return (
    <div className={`boss-layer ${result?.correct ? 'boss-layer--hit' : result ? 'boss-layer--retaliating' : ''}`} aria-label={`Harmonic Guardian shield ${Math.round(shield)} percent`}>
      <div className="boss-layer__guardian" aria-hidden="true"><i /><i /><b /></div>
      <div className="boss-layer__hud"><span>HARMONIC GUARDIAN</span><strong>SHIELD {Math.round(shield)}%</strong><i><b style={{ width: `${shield}%` }} /></i></div>
    </div>
  );
};

export default React.memo(BossLayer);
