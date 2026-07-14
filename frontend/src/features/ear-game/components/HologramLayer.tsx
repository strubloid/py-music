import React from 'react';

const HologramLayer = ({ answers, result }) => (
  <div className="hologram-layer" aria-label="Comparison hologram deck" data-comparison-mode="hologram" role="status">
    <header><span>HOLOGRAM DECK</span><strong>A/B SIGNAL ANALYSIS</strong></header>
    <div className="hologram-layer__cards">{answers.map((answer) => <article key={answer.id} className={answer.label === result.selectedLabel ? 'is-selected' : answer.label === result.correctLabel ? 'is-correct' : ''}><span>{answer.label === result.selectedLabel ? 'YOUR SIGNAL' : answer.label === result.correctLabel ? 'TRUE SIGNAL' : `GATE ${answer.lane + 1}`}</span><strong>{answer.label}</strong><i /></article>)}</div>
    <p>Replay the prompt to compare your selected signal against the true harmonic route.</p>
  </div>
);

export default React.memo(HologramLayer);
