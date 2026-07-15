// Scale Path phase state machine — mirrors earGameReducer structure

export type ScalePathPhase =
  | 'loading'
  | 'ready'
  | 'accepting-input'
  | 'committing-answer'
  | 'showing-correct'
  | 'showing-incorrect'
  | 'comparison'
  | 'paused'
  | 'run-complete'
  | 'error';

export interface ScalePathPosition {
  string: string;
  fret: number;
  note: string;
  stringIndex: number;
  pitch: number;
}

export interface ScalePathFragment {
  fragmentIndex: number;
  root: string;
  mode: string;
  difficulty: number;
  anchor: ScalePathPosition;
  suffix: ScalePathPosition[];
  gap: ScalePathPosition | null;
  candidates: Array<ScalePathPosition & { isCorrect: boolean }>;
  direction: 'left' | 'up';
  degreeClue: string;
  correctCandidateId?: string;
}

export interface ScalePathRun {
  runId: string;
  root: string;
  mode: string;
  difficulty: number;
  octaves: number;
  fretCount: number;
  positions: ScalePathPosition[];
  fragments: ScalePathFragment[];
}

export interface ScalePathState {
  phase: ScalePathPhase;
  resumePhase: ScalePathPhase | null;
  runId: string | null;
  run: ScalePathRun | null;
  fragmentIndex: number;
  fragmentCount: number;
  fragment: ScalePathFragment | null;
  selectedCandidateIndex: number | null;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  xpTotal: number;
  inputLocked: boolean;
  reducedMotion: boolean;
  error: string | null;
  result: {
    correct: boolean;
    selectedNote: string;
    correctNote: string;
    awardedXp: number;
    explanation: string;
  } | null;
}

const LOCKED_PHASES: Set<ScalePathPhase> = new Set([
  'loading', 'ready', 'committing-answer',
  'showing-correct', 'showing-incorrect', 'comparison',
  'paused', 'run-complete', 'error',
]);

export const isScalePathInputLocked = (state: ScalePathState) =>
  state.inputLocked || LOCKED_PHASES.has(state.phase);

export const createInitialScalePathState = (opts: { reducedMotion?: boolean; challengeCount?: number } = {}): ScalePathState => ({
  phase: 'loading',
  resumePhase: null,
  runId: globalThis.crypto?.randomUUID?.() || `sp-${Date.now()}`,
  run: null,
  fragmentIndex: 0,
  fragmentCount: opts.challengeCount ?? 5,
  fragment: null,
  selectedCandidateIndex: null,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctCount: 0,
  xpTotal: 0,
  inputLocked: true,
  reducedMotion: opts.reducedMotion ?? false,
  error: null,
  result: null,
});

export const scalePathReducer = (state: ScalePathState, event: { type: string; [key: string]: unknown }): ScalePathState => {
  switch (event.type) {
    case 'RUN_RESET':
      return createInitialScalePathState({ reducedMotion: state.reducedMotion, challengeCount: state.fragmentCount });

    case 'RUN_LOADING':
      return { ...state, phase: 'loading', run: null, fragment: null, error: null, inputLocked: true };

    case 'RUN_LOADED': {
      const run = event.run as ScalePathRun;
      const first = run.fragments?.[0] || null;
      return {
        ...state,
        phase: 'ready',
        run,
        runId: run.runId,
        fragmentIndex: 0,
        fragment: first,
        selectedCandidateIndex: null,
        error: null,
        inputLocked: true,
      };
    }

    case 'FRAGMENT_PREVIEW_START':
      return { ...state, phase: 'ready', inputLocked: true };

    case 'INPUT_ACCEPTED':
      if (!['ready', 'accepting-input'].includes(state.phase)) return state;
      return { ...state, phase: 'accepting-input', inputLocked: false };

    case 'MOVE_CANDIDATE': {
      if (isScalePathInputLocked(state) || !state.fragment?.candidates?.length) return state;
      const count = state.fragment.candidates.length;
      const delta = (event.direction as number) as number;
      const next = (state.selectedCandidateIndex ?? 0 + delta + count) % count;
      return { ...state, selectedCandidateIndex: next };
    }

    case 'SELECT_CANDIDATE': {
      if (isScalePathInputLocked(state)) return state;
      const idx = event.index as number;
      return { ...state, selectedCandidateIndex: idx };
    }

    case 'COMMIT_ANSWER':
      if (isScalePathInputLocked(state) || state.selectedCandidateIndex === null) return state;
      return { ...state, phase: 'committing-answer', inputLocked: true };

    case 'ANSWER_RESOLVED': {
      if (state.phase !== 'committing-answer') return state;
      const correct = event.correct as boolean;
      const awardedXp = (event.awardedXp as number) ?? 0;
      const explanation = (event.explanation as string) ?? '';
      const combo = correct ? state.combo + 1 : 0;
      return {
        ...state,
        phase: correct ? 'showing-correct' : 'showing-incorrect',
        score: state.score + (correct ? awardedXp : 0),
        combo,
        maxCombo: Math.max(state.maxCombo, combo),
        correctCount: state.correctCount + (correct ? 1 : 0),
        xpTotal: state.xpTotal + awardedXp,
        result: {
          correct,
          selectedNote: event.selectedNote as string,
          correctNote: event.correctNote as string,
          awardedXp,
          explanation,
        },
        inputLocked: true,
      };
    }

    case 'SHOW_COMPARISON':
      if (!['showing-correct', 'showing-incorrect'].includes(state.phase)) return state;
      return { ...state, resumePhase: state.phase, phase: 'comparison', inputLocked: true };

    case 'COMPARISON_ENDED':
      if (state.phase !== 'comparison') return state;
      return { ...state, phase: state.resumePhase || 'showing-incorrect', resumePhase: null, inputLocked: true };

    case 'NEXT_FRAGMENT': {
      if (!['showing-correct', 'showing-incorrect'].includes(state.phase)) return state;
      const nextIndex = state.fragmentIndex + 1;
      const nextFragment = state.run?.fragments?.[nextIndex] || null;
      if (nextIndex >= state.fragmentCount) {
        return { ...state, phase: 'run-complete', fragmentIndex: nextIndex, inputLocked: true };
      }
      return {
        ...state,
        phase: 'ready',
        fragmentIndex: nextIndex,
        fragment: nextFragment,
        selectedCandidateIndex: null,
        result: null,
        inputLocked: true,
      };
    }

    case 'PAUSE':
      if (['paused', 'run-complete', 'loading', 'error'].includes(state.phase)) return state;
      return { ...state, resumePhase: state.phase, phase: 'paused', inputLocked: true };

    case 'RESUME':
      if (state.phase !== 'paused') return state;
      return {
        ...state,
        phase: state.resumePhase === 'ready' ? 'ready' : 'accepting-input',
        resumePhase: null,
        inputLocked: state.resumePhase === 'ready',
      };

    case 'SET_REDUCED_MOTION':
      return { ...state, reducedMotion: event.value as boolean };

    case 'ERROR':
      return { ...state, phase: 'error', inputLocked: true, error: (event.error as string) || 'An error occurred.' };

    default:
      return state;
  }
};
