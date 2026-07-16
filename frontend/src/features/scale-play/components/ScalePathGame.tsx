// Scale Path game page — /play/scales
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createInitialScalePathState,
  scalePathReducer,
  isScalePathInputLocked,
  type ScalePathState,
} from '../state/scalePathReducer';
import { normalizeRun } from '../services/scalePathNormalizer';
import { getScalePathRun, completeScalePathFragment } from '../../../services/scalePlayApi';
import ScalePathFretboard from './ScalePathFretboard';
import ScaleRouteOverlay from './ScaleRouteOverlay';
import ScaleFragmentHud from './ScaleFragmentHud';
import type { FretboardPosition } from './ScaleFretboardBase';
import type { ScalePathPosition } from '../state/scalePathReducer';
import '../styles/scale-path.scss';

const ScalePathGame: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const settingsRef = useRef({ reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false });
  const [game, dispatch] = useReducer(
    scalePathReducer,
    null,
    () => createInitialScalePathState({ reducedMotion: settingsRef.current.reducedMotion }),
  );
  const gameRef = useRef(game);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [committedAnswer, setCommittedAnswer] = useState<ScalePathPosition | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<ScalePathPosition | null>(null);

  gameRef.current = game;

  const clearTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const loadRun = useCallback(async () => {
    dispatch({ type: 'RUN_LOADING' });
    setCommittedAnswer(null);
    setCorrectAnswer(null);
    try {
      const res = await getScalePathRun({});
      const normalized = normalizeRun(res.data);
      dispatch({ type: 'RUN_LOADED', run: normalized });
      setAnnouncement(`Scale Path loaded. ${normalized.root} ${normalized.mode}. Fragment 1 ready.`);
    } catch {
      dispatch({ type: 'ERROR', error: 'Could not load a Scale Path run. Check your connection and try again.' });
    }
  }, []);

  // Auto-transition to accepting-input after a brief ready phase
  useEffect(() => {
    if (game.phase === 'ready') {
      const t = window.setTimeout(() => {
        dispatch({ type: 'INPUT_ACCEPTED' });
      }, 800);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [game.phase]);

  useEffect(() => {
    loadRun();
    return clearTimer;
  }, [loadRun, clearTimer]);

  const selectCandidate = useCallback((pos: FretboardPosition, index: number) => {
    if (isScalePathInputLocked(gameRef.current)) return;
    dispatch({ type: 'SELECT_CANDIDATE', index });
    setAnnouncement(`${pos.note} on string ${pos.string} fret ${pos.fret} selected. Press Enter or Space to commit.`);
  }, []);

  const moveLeft = useCallback(() => {
    if (isScalePathInputLocked(gameRef.current)) return;
    dispatch({ type: 'MOVE_CANDIDATE', direction: -1 });
  }, []);

  const moveRight = useCallback(() => {
    if (isScalePathInputLocked(gameRef.current)) return;
    dispatch({ type: 'MOVE_CANDIDATE', direction: 1 });
  }, []);

  const commitAnswer = useCallback(async () => {
    const state = gameRef.current;
    if (state.phase !== 'accepting-input' || state.selectedCandidateIndex === null || !state.fragment) return;
    const fragment = state.fragment;
    const candidates = fragment.candidates ?? [];
    const selectedIdx = state.selectedCandidateIndex;
    if (selectedIdx >= candidates.length) return;

    const selected = candidates[selectedIdx];
    dispatch({ type: 'COMMIT_ANSWER' });

    setCommittedAnswer({ ...selected } as ScalePathPosition);
    let correct = false;
    let awardedXp = 0;
    let correctPos: ScalePathPosition | null = null;
    try {
      const res = await completeScalePathFragment({
        runId: state.runId ?? '',
        fragmentIndex: state.fragmentIndex,
        submittedPosition: { string: selected.string, fret: selected.fret },
        difficulty: fragment.difficulty ?? 1,
      });
      correct = Boolean(res.data.correct);
      awardedXp = res.data.xp_awarded ?? 0;
      correctPos = res.data.correctAnswer ?? null;
      if (correctPos) setCorrectAnswer(correctPos);
    } catch {
      dispatch({ type: 'ERROR', error: 'Could not verify this selection. Please start a new run.' });
      return;
    }

    const explanation = correct
      ? `${selected.note} is degree ${fragment.degreeClue} in ${fragment.root} ${fragment.mode}.`
      : `${selected.note} is outside this scale path. The correct note is ${correctPos?.note ?? 'shown above'}.`;

    dispatch({ type: 'ANSWER_RESOLVED', correct, selectedNote: selected.note ?? '', correctNote: correctPos?.note ?? '', awardedXp, explanation });
    setAnnouncement(correct
      ? `Correct! ${explanation} +${awardedXp} XP.`
      : `Incorrect. ${explanation}`);

    // Auto-advance
    const delay = correct ? 2200 : 3600;
    transitionTimerRef.current = window.setTimeout(() => {
      dispatch({ type: 'NEXT_FRAGMENT' });
    }, delay);
  }, []);

  const handleCommitKey = useCallback(() => {
    commitAnswer();
  }, [commitAnswer]);

  const handlePause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const handleResume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const handleRestart = useCallback(() => {
    clearTimer();
    loadRun();
  }, [clearTimer, loadRun]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'Escape') {
        e.preventDefault();
        if (gameRef.current.phase === 'paused') handleResume();
        else handlePause();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePause, handleResume]);

  const { fragment, selectedCandidateIndex } = game;
  const focusIndex = selectedCandidateIndex;

  return (
    <main
      className={`scale-path-game ${game.reducedMotion ? 'reduced-motion' : ''}`}
      data-phase={game.phase}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      <header className="sp-header">
        <div className="sp-header__brand">
          <span aria-hidden="true">♩</span>
          <div>
            <p>Scale Path</p>
            <h1>Find the Next Note</h1>
          </div>
        </div>
        <div className="sp-header__actions">
          <button type="button" onClick={handleRestart} title="Restart run" aria-label="Restart Scale Path run">
            <RotateCcw size={16} />
          </button>
          <button type="button" onClick={handlePause} aria-label="Pause">
            <Pause size={16} />
          </button>
        </div>
      </header>

      {game.phase !== 'run-complete' && game.phase !== 'error' && (
        <>
          <ScaleFragmentHud
            fragment={fragment}
            fragmentIndex={game.fragmentIndex}
            fragmentCount={game.fragmentCount}
            combo={game.combo}
            correctCount={game.correctCount}
            score={game.score}
            phase={game.phase}
          />

          {fragment && (
            <ScaleRouteOverlay
              fragment={fragment}
              correctAnswer={correctAnswer}
              reducedMotion={game.reducedMotion}
            />
          )}

          <div className="sp-board">
            {fragment && (
              <ScalePathFretboard
                fragment={fragment}
                selectedIndex={selectedCandidateIndex}
                committedAnswer={committedAnswer}
                correctAnswer={correctAnswer}
                focusIndex={focusIndex}
                reducedMotion={game.reducedMotion}
                onPositionSelect={selectCandidate}
                onCommit={commitAnswer}
                onMoveLeft={moveLeft}
                onMoveRight={moveRight}
                onCommitKey={handleCommitKey}
              />
            )}
          </div>

          <div className="sp-controls">
            <button
              type="button"
              className="sp-btn sp-btn--commit"
              onClick={commitAnswer}
              disabled={!['accepting-input'].includes(game.phase) || selectedCandidateIndex === null}
            >
              Commit Note
            </button>
          </div>

          <footer className="sp-legend" aria-label="Keyboard controls">
            <span><kbd>A</kbd><kbd>D</kbd> move</span>
            <span><kbd>Space</kbd> commit</span>
            <span><kbd>P</kbd> pause</span>
          </footer>
        </>
      )}

      {game.phase === 'run-complete' && (
        <div className="sp-complete" role="region" aria-label="Run complete">
          <h2>Run Complete!</h2>
          <div className="sp-complete__stats">
            <div className="sp-stat"><span>Correct</span><strong>{game.correctCount}/{game.fragmentCount}</strong></div>
            <div className="sp-stat"><span>Score</span><strong>{game.score}</strong></div>
            <div className="sp-stat"><span>Max Combo</span><strong>{game.maxCombo}</strong></div>
            <div className="sp-stat"><span>XP Earned</span><strong>{game.xpTotal}</strong></div>
          </div>
          <button type="button" className="sp-btn sp-btn--commit" onClick={handleRestart}>
            Play Again
          </button>
        </div>
      )}

      {game.phase === 'error' && (
        <div className="sp-error" role="alert">
          <p>{game.error}</p>
          <button type="button" className="sp-btn sp-btn--commit" onClick={handleRestart}>Try Again</button>
        </div>
      )}

      {game.phase === 'paused' && (
        <div className="sp-paused-overlay" role="dialog" aria-label="Game paused">
          <div className="sp-paused-card">
            <h2>Paused</h2>
            <button type="button" className="sp-btn sp-btn--commit" onClick={handleResume}>Resume</button>
            <button type="button" className="sp-btn" onClick={handleRestart}>Restart</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ScalePathGame;
