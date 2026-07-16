import React from 'react';

const VARIANT_PRESENTATION = {
  'catch-root': { icon: '●', object: 'Sound orb', action: 'Catch orb' },
  'bridge-builder': { icon: '◆', object: 'Interval stone', action: 'Place stone' },
  'echo-chase': { icon: '➜', object: 'Echo route', action: 'Chase echo' },
};

const AnswerGate = ({ answer, phase, selected, disabled, hidden, result, correct, reducedMotion, variant = 'catch-root', onSelect, onCommit }) => {
  const revealed = !['loading', 'ready', 'playing-prompt'].includes(phase);
  const outcome = result ? (correct ? 'correct' : result.selectedAnswerId === answer.id ? 'incorrect' : 'dimmed') : '';
  const state = hidden ? 'eliminated' : outcome || (!revealed ? 'locked' : selected ? 'focused' : 'revealed');
  const presentation = VARIANT_PRESENTATION[variant] || VARIANT_PRESENTATION['catch-root'];
  return (
    <button
      type="button"
      className={`game-gate game-gate--${state} game-gate--${variant} ${reducedMotion ? 'game-gate--reduced-motion' : ''}`}
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
      <span className="game-gate__frame" aria-hidden="true"><span className="game-gate__card"><span className="game-gate__back"><i>♪</i><em>Signal locked</em></span><span className="game-gate__front"><i>{presentation.icon}</i><em>{presentation.object}</em><b /></span></span></span>
      <span className="game-gate__lane">{answer.lane + 1}</span>
      <span className="game-gate__label"><strong>{revealed ? answer.label : 'Listening…'}</strong><small>{hidden ? 'Eliminated' : selected ? 'Commit · Enter' : revealed ? presentation.action : 'Signal locked'}</small></span>
      <span className="game-gate__platform" aria-hidden="true" />
    </button>
  );
};

export default React.memo(AnswerGate);
