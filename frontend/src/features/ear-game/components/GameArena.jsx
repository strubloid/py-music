import React from 'react';
import { Gauge, Play, RotateCcw } from 'lucide-react';
import AnswerGate from './AnswerGate.jsx';
import NoteAvatar from './NoteAvatar.jsx';
import ResultPresentation from './ResultPresentation.jsx';

const GameArena = ({
  game,
  challenge,
  result,
  hiddenAnswerIds,
  playing,
  avatarState,
  inputSignal,
  onPlay,
  onSelect,
  onCommit,
  onCompare,
  onNext,
  bossMode,
}) => {
  const gateCount = challenge?.answers.length || 1;
  const visualMode = game.phase === 'comparison' ? 'comparison' : result?.correct ? 'correct' : result ? 'incorrect' : playing ? 'playing' : game.phase === 'accepting-input' ? 'active' : 'ready';

  return (
    <section
      className={`game-arena game-arena--${visualMode}`}
      aria-label="Sound Gates game arena"
      data-phase={game.phase}
      data-combo-tier={Math.min(4, game.combo >= 30 ? 4 : game.combo >= 20 ? 3 : game.combo >= 10 ? 2 : game.combo >= 5 ? 1 : 0)}
    >
      <div className="arena-backdrop" aria-hidden="true"><div className="arena-backdrop__city" /></div>
      <div className="arena-atmosphere" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="arena-vignette" aria-hidden="true" />
      {bossMode && <div className="arena-boss" aria-label="Harmonic guardian shield" data-boss-mode="true"><div className="arena-boss__body" /><div className="arena-boss__bar"><span>GUARDIAN SHIELD</span><i style={{ '--boss-health': `${Math.max(8, 100 - game.correctCount * 20)}%` }} /></div></div>}

      <div className={`listening-beacon listening-beacon--${playing ? 'playing' : 'ready'}`}>
        <button
          type="button"
          className="listening-beacon__button"
          onClick={onPlay}
          disabled={playing}
          aria-label={`${game.phase === 'ready' ? 'Start' : 'Replay'} ${challenge?.prompt.playbackMode || ''} musical question`}
        >
          {playing ? <Gauge /> : game.phase === 'ready' ? <Play /> : <RotateCcw />}
        </button>
        <div><span>{playing ? 'Listening signal' : 'Listening beacon'}</span><strong>{challenge?.prompt.playbackMode === 'harmonic' ? 'Harmonic chord' : challenge?.prompt.playbackMode === 'sequence' ? 'Chord pair' : 'Melodic signal'}</strong></div>
      </div>

      <div className="arena-prompt">
        <span>{challenge?.title}</span>
        <h2>{challenge?.question}</h2>
        <p>{game.phase === 'ready' ? 'Activate the beacon. Movement unlocks when the signal resolves.' : 'Move across the lit lanes, then commit the focused gate.'}</p>
        <output className={`arena-input-signal ${inputSignal.locked ? 'arena-input-signal--locked' : ''}`}>
          <kbd>{inputSignal.action ? inputSignal.action.replace('move-', '').replace('lane-', '') : '⌨'}</kbd>{inputSignal.label}
        </output>
      </div>

      <div className="runner-track" aria-hidden="true">
        {Array.from({ length: gateCount }, (_, index) => <span className={index === game.avatarLane ? 'runner-track__lane runner-track__lane--active' : 'runner-track__lane'} key={index} />)}
      </div>

      <div className="gate-deck" style={{ '--gate-count': gateCount }} role="radiogroup" aria-label="Answer gates">
        {challenge?.answers.map((answer) => (
          <AnswerGate
            key={answer.id}
            answer={answer}
            phase={game.phase}
            selected={game.selectedAnswerId === answer.id}
            disabled={game.phase !== 'accepting-input'}
            hidden={hiddenAnswerIds.includes(answer.id)}
            result={result}
            correct={challenge.correctAnswerId === answer.id}
            reducedMotion={game.reducedMotion}
            onSelect={(id) => onSelect(id, 'pointer')}
            onCommit={onCommit}
          />
        ))}
      </div>
      <NoteAvatar lane={game.avatarLane} laneCount={gateCount} state={avatarState} reducedMotion={game.reducedMotion} />
      {game.phase === 'comparison' && result && <div className="comparison-overlay" role="status" data-comparison-mode="hologram"><div className="comparison-overlay__card"><span>YOUR GATE</span><strong>{result.selectedLabel}</strong><i className="comparison-overlay__wave" /></div><span>VS</span><div className="comparison-overlay__card"><span>TRUE SIGNAL</span><strong>{result.correctLabel}</strong><i className="comparison-overlay__wave" /></div></div>}
      {game.phase !== 'comparison' && <ResultPresentation challenge={challenge} result={result} combo={game.combo} onCompare={onCompare} onNext={onNext} />}
    </section>
  );
};

export default React.memo(GameArena);
