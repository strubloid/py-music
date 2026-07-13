import React from 'react';

const AnswerGate = ({ answer, selected, disabled, hidden, result, correct, onSelect, onCommit }) => {
  if (hidden) return <div className="answer-gate answer-gate--removed" aria-hidden="true"><span>Gate muted</span></div>;
  const outcome = result ? (correct ? 'correct' : result.selectedAnswerId === answer.id ? 'incorrect' : '') : '';
  return (
    <button
      type="button"
      className={`answer-gate ${selected ? 'answer-gate--selected' : ''} ${outcome ? `answer-gate--${outcome}` : ''}`}
      role="radio"
      aria-checked={selected}
      aria-current={selected ? 'true' : undefined}
      aria-label={answer.accessibleLabel}
      disabled={disabled}
      onClick={() => (selected ? onCommit(answer.id) : onSelect(answer.id))}
      onDoubleClick={() => onCommit(answer.id)}
    >
      <span className="answer-gate__number">{answer.lane + 1}</span>
      <span className="answer-gate__arch" aria-hidden="true" />
      <strong>{answer.label}</strong>
      <small>{selected ? 'Press again or Enter' : 'Move here'}</small>
    </button>
  );
};

export default React.memo(AnswerGate);
