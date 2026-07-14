import React from 'react';

const PartyLayer = ({ combo, result }) => (
  <div className="party-layer" aria-hidden="true">
    <div className="party-layer__beams" /><div className="party-layer__confetti">♪ ♫ · ♪ ✦ ♫ · ♪</div>
    <strong>{result?.correct ? 'PERFECT!' : `${combo}x COMBO!`}</strong>
  </div>
);

export default React.memo(PartyLayer);
