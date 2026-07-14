import React from 'react';

const AnswerGate = ({ answer, phase, selected, disabled, hidden, result, correct, reducedMotion, onSelect, onCommit }) => {
  const revealed = !['loading', 'ready', 'playing-prompt'].includes(phase);
  const outcome = result ? (correct ? 'correct' : result.selectedAnswerId === answer.id ? 'incorrect' : 'dimmed') : '';
  const state = hidden ? 'eliminated' : outcome || (!revealed ? 'locked' : selected ? 'focused' : 'revealed');
  return (
    <button
      type="button"
      className={`game-gate game-gate--${state} ${reducedMotion ? 'game-gate--reduced-motion' : ''}`}
      role="radio"
      aria-checked={selected}
      aria-current={selected ? 'true' : undefined}
      aria-label={hidden ? `${answer.accessibleLabel}, eliminated` : answer.accessibleLabel}
      aria-disabled={disabled || hidden}
      disabled={disabled || hidden}
      data-gate-state={state}
      onClick={() => (selected ? onCommit(answer.id) : onSelect(answer.id))}
      onDoubleClick={() => onCommit(answer.id)}
    >
      <span className="game-gate__beam" aria-hidden="true" />
      <span className="game-gate__frame" aria-hidden="true"><span className="game-gate__card"><span className="game-gate__back"><i>♪</i><em>Signal locked</em></span><span className="game-gate__front"><i>♫</i><em>Sound gate</em><b /></span></span></span>
      <span className="game-gate__lane">{answer.lane + 1}</span>
      <span className="game-gate__label"><strong>{revealed ? answer.label : 'Listening…'}</strong><small>{hidden ? 'Eliminated' : selected ? 'Commit · Enter' : revealed ? 'Move to gate' : 'Signal locked'}</small></span>
      <span className="game-gate__platform" aria-hidden="true" />
    </button>
  );
};

export default React.memo(AnswerGate);
