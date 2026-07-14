import React from 'react';
import { Gauge, Play, RotateCcw } from 'lucide-react';
import AnswerGate from './AnswerGate';
import NoteAvatar from './NoteAvatar';
import ResultPresentation from './ResultPresentation';
import BossLayer from './BossLayer';
import PuzzleLayer from './PuzzleLayer';
import PinballLayer from './PinballLayer';
import PartyLayer from './PartyLayer';
import HologramLayer from './HologramLayer';
import SideScrollerLayer from './SideScrollerLayer';

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
  const puzzleMode = ['theory', 'scales'].includes(challenge?.category);
  const pinballMode = game.combo >= 5 || challenge?.category === 'intervals';
  const partyMode = game.combo >= 30;
  const activeBoss = bossMode || game.challengeIndex === game.challengeCount - 1;
  const stageStep = Math.min(game.challengeCount, game.challengeIndex + 1);
  const visualMode = game.phase === 'comparison' ? 'comparison' : result?.correct ? 'correct' : result ? 'incorrect' : playing ? 'playing' : game.phase === 'accepting-input' ? 'active' : 'ready';

  return (
    <section
      className={`game-arena game-arena--${visualMode} ${puzzleMode ? 'game-arena--puzzle' : ''} ${activeBoss ? 'game-arena--boss' : ''} ${pinballMode ? 'game-arena--pinball' : ''} ${partyMode ? 'game-arena--party' : ''}`}
      aria-label="Sound Gates game arena"
      data-phase={game.phase}
      data-combo-tier={Math.min(4, game.combo >= 30 ? 4 : game.combo >= 20 ? 3 : game.combo >= 10 ? 2 : game.combo >= 5 ? 1 : 0)}
    >
      <div className="arena-backdrop" aria-hidden="true"><div className="arena-backdrop__stars" /><div className="arena-backdrop__city" /></div>
      <div className="arena-atmosphere" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="arena-vignette" aria-hidden="true" />
      <SideScrollerLayer
        lane={game.avatarLane}
        laneCount={gateCount}
        stageStep={stageStep}
        portalLabel={game.phase === 'ready' ? 'Start stage' : ['showing-correct', 'showing-incorrect'].includes(game.phase) ? 'Enter next stage' : stageStep === game.challengeCount ? 'Reward vault locked' : 'Stage portal locked'}
        portalDisabled={!['ready', 'showing-correct', 'showing-incorrect'].includes(game.phase)}
        onPortalActivate={game.phase === 'ready' ? onPlay : onNext}
      />
      <div className="arena-stage-map" aria-label={`Stage progress: sector ${stageStep} of ${game.challengeCount}`}>
        <span>STAGE RUN</span>
        <ol>{Array.from({ length: game.challengeCount }, (_, index) => <li key={index} className={index < stageStep - 1 ? 'arena-stage-map__sector--cleared' : index === stageStep - 1 ? 'arena-stage-map__sector--active' : ''}><b>{index + 1}</b><small>{index === game.challengeCount - 1 ? 'VAULT' : `SECTOR ${index + 1}`}</small></li>)}</ol>
      </div>
      <div className="arena-world-signature" aria-hidden="true"><i>♪</i><span>HARMONIC CITY</span></div>
      {activeBoss && <BossLayer correctCount={game.correctCount} challengeCount={game.challengeCount} result={result} />}
      {puzzleMode && <PuzzleLayer question={challenge?.question} selectedLane={game.avatarLane} />}
      {pinballMode && <PinballLayer combo={game.combo} />}
      {partyMode && <PartyLayer combo={game.combo} result={result} />}

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
        <div className="listening-beacon__meter" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>

      <div className="arena-prompt">
        <span>{challenge?.title}</span>
        <h2>{challenge?.question}</h2>
        <p>{game.phase === 'ready' ? 'Activate the beacon. Movement unlocks when the signal resolves.' : 'Move across the lit lanes, then commit the focused gate.'}</p>
        <output className={`arena-input-signal ${inputSignal.locked ? 'arena-input-signal--locked' : ''}`}>
          <kbd>{inputSignal.action ? inputSignal.action.replace('move-', '').replace('lane-', '') : '⌨'}</kbd>{inputSignal.label}
        </output>
      </div>
      {game.phase === 'accepting-input' && <div className="arena-unlocked" role="status">MOVEMENT UNLOCKED</div>}

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
      {game.phase === 'comparison' && result && <HologramLayer answers={challenge?.answers || []} result={result} />}
      {game.phase !== 'comparison' && <ResultPresentation challenge={challenge} result={result} combo={game.combo} milestone={stageStep === game.challengeCount || game.combo > 0 && game.combo % 5 === 0} onCompare={onCompare} onNext={onNext} />}
    </section>
  );
};

export default React.memo(GameArena);
