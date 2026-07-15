// Normalize API scale data → game data for Scale Path

import type { ScalePathFragment, ScalePathPosition, ScalePathRun } from '../state/scalePathReducer';

export interface NormalizedFragment {
  id: string;
  root: string;
  mode: string;
  difficulty: number;
  anchor: ScalePathPosition;
  suffix: ScalePathPosition[];
  gap: ScalePathPosition | null;
  candidates: Array<ScalePathPosition & { isCorrect: boolean; id: string }>;
  direction: 'left' | 'up';
  degreeClue: string;
}

export function normalizeFragment(raw: ScalePathFragment, index: number): NormalizedFragment {
  return {
    id: `frag-${index}`,
    root: raw.root,
    mode: raw.mode,
    difficulty: raw.difficulty ?? 1,
    anchor: raw.anchor,
    suffix: raw.suffix ?? [],
    gap: raw.gap,
    candidates: (raw.candidates ?? []).map((c, ci) => ({
      ...c,
      id: `cand-${index}-${ci}`,
    })),
    direction: raw.direction ?? 'left',
    degreeClue: raw.degreeClue ?? '?_?',
  };
}

export function normalizeRun(raw: ScalePathRun): {
  runId: string;
  root: string;
  mode: string;
  difficulty: number;
  octaves: number;
  fretCount: number;
  positions: ScalePathPosition[];
  fragments: NormalizedFragment[];
} {
  return {
    runId: raw.runId,
    root: raw.root,
    mode: raw.mode,
    difficulty: raw.difficulty ?? 1,
    octaves: raw.octaves ?? 1,
    fretCount: raw.fretCount ?? 12,
    positions: raw.positions ?? [],
    fragments: (raw.fragments ?? []).map((f, i) => normalizeFragment(f, i)),
  };
}
