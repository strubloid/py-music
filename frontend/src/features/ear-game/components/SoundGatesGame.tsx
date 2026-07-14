import React from 'react';
import { Pause, Settings2, Volume2, VolumeX } from 'lucide-react';
import StreakBadge from '../../../components/game/StreakBadge';
import EarGameHud from './EarGameHud';
import GameArena from './GameArena';
import AbilityDock from './AbilityDock';
import TouchControls from './TouchControls';
import '../styles/sound-gates.scss';

const SoundGatesGame = ({ game, challenge, result, hiddenAnswerIds, avatarState, playing, inputSignal, powers, focus, rankMeta, streak, instrument, instruments, audioState, highContrast, bossMode, onPlay, onSelect, onCommit, onCompare, onNext, onUsePower, onInstrumentChange, onAction, onOpenSettings, overlays }) => {
  const comboTier = game.combo >= 30 ? 4 : game.combo >= 20 ? 3 : game.combo >= 10 ? 2 : game.combo >= 5 ? 1 : 0;
  return (
    <main className={`sound-gates-game combo-tier-${comboTier} ${comboTier === 4 ? 'sound-gates-game--party-mode' : ''} ${highContrast ? 'sound-gates-game--high-contrast' : ''} ${game.reducedMotion ? 'sound-gates-game--reduced-motion' : ''}`} data-phase={game.phase} data-combo-tier={comboTier} data-party-mode={comboTier === 4} data-boss-mode={bossMode}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{inputSignal.announcement}</div>
      <header className="sound-gates-header">
        <div className="sound-gates-header__brand"><span aria-hidden="true">♪</span><div><p>Note Runner</p><h1>Sound Gates</h1></div></div>
        <div className="sound-gates-header__rank" aria-label={`${rankMeta.name}, ${rankMeta.progressLabel}`}><span>{rankMeta.name}</span><strong>{rankMeta.challengePending ? 'Rank challenge' : `Lv. ${rankMeta.level}/${rankMeta.levels} · ${rankMeta.remainingLevels} to go`}</strong></div>
        <div className="sound-gates-header__actions"><StreakBadge streak={streak} /><button type="button" aria-label={game.muted ? 'Unmute game effects' : 'Mute game effects'} onClick={() => onAction('mute')}>{game.muted ? <VolumeX /> : <Volume2 />}</button><button type="button" aria-label="Open game settings" onClick={onOpenSettings} disabled={!['ready', 'accepting-input'].includes(game.phase)}><Settings2 /></button><button type="button" aria-label="Pause game" onClick={() => onAction('pause')}><Pause /></button></div>
      </header>
      <EarGameHud challengeIndex={game.challengeIndex} challengeCount={game.challengeCount} combo={game.combo} correctCount={game.correctCount} score={game.score} skill={challenge?.title || 'Listening'} />
      <GameArena game={game} challenge={challenge} result={result} hiddenAnswerIds={hiddenAnswerIds} playing={playing} avatarState={avatarState} inputSignal={inputSignal} onPlay={onPlay} onSelect={onSelect} onCommit={onCommit} onCompare={onCompare} onNext={onNext} bossMode={bossMode} />
      <AbilityDock powers={powers} game={game} focus={focus} instrument={instrument} instruments={instruments} audioState={audioState} onInstrumentChange={onInstrumentChange} onUsePower={onUsePower} />
      <TouchControls onAction={onAction} disabled={game.phase !== 'accepting-input'} />
      <footer className="sound-gates-legend" aria-label="Keyboard controls"><span><kbd>A</kbd><kbd>D</kbd> move</span><span><kbd>Space</kbd> commit</span><span><kbd>R</kbd> replay</span><span><kbd>⇧R</kbd> slow</span><span><kbd>C</kbd> compare</span><span><kbd>P</kbd> pause</span></footer>
      {overlays}
    </main>
  );
};

export default React.memo(SoundGatesGame);
