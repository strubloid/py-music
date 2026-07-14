import React from 'react';

const PuzzleLayer = ({ question, selectedLane }) => (
  <div className="puzzle-layer" aria-hidden="true">
    <div className="puzzle-layer__clue"><span>THEORY LINK</span><strong>{question || 'Resolve the musical relationship'}</strong></div>
    <div className="puzzle-layer__routes"><i className={selectedLane === 0 ? 'is-active' : ''} /><i className={selectedLane === 1 ? 'is-active' : ''} /><i className={selectedLane === 2 ? 'is-active' : ''} /><i className={selectedLane === 3 ? 'is-active' : ''} /></div>
  </div>
);

export default React.memo(PuzzleLayer);
