import React from 'react';
import { Headphones, XCircle } from 'lucide-react';

const ResultPresentation = ({ challenge, result, combo, onCompare, onNext }) => {
  if (!result) return null;
  return (
    <div className={`result-presentation result-presentation--${result.correct ? 'correct' : 'incorrect'}`} role="status" data-result={result.correct ? 'correct' : 'incorrect'}>
      <div className="result-presentation__shockwave" aria-hidden="true" />
      <div className="result-presentation__copy">
        <span>{result.correct ? combo >= 30 ? 'PERFECT!' : 'CORRECT!' : 'NOT THIS GATE'}</span>
        {result.correct ? <strong>+{result.awardedXp || 1250}</strong> : <strong>Correct: {result.correctLabel}</strong>}
        <p>{result.correct ? challenge?.explanation.summary : `${challenge?.explanation.summary} You chose ${result.selectedLabel}.`}</p>
        {result.correct && <em>COMBO {combo}x</em>}
      </div>
      <div className="result-presentation__actions">
        <button type="button" onClick={onCompare}><Headphones /> Compare <kbd>C</kbd></button>
        <button type="button" onClick={onNext}>{result.correct ? 'Next gate' : 'Try next gate'} <kbd>Enter</kbd></button>
      </div>
      {!result.correct && <XCircle className="result-presentation__error" aria-hidden="true" />}
    </div>
  );
};

export default React.memo(ResultPresentation);
