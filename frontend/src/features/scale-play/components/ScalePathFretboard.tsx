// Scale Path interactive fretboard — shows revealed route + eligible candidates
import React, { useCallback } from 'react';
import ScaleFretboardBase, { type FretboardPosition } from './ScaleFretboardBase';
import type { ScalePathPosition, ScalePathFragment } from '../state/scalePathReducer';

interface ScalePathFretboardProps {
  fragment: ScalePathFragment;
  selectedIndex: number | null;
  committedAnswer: ScalePathPosition | null;
  correctAnswer: ScalePathPosition | null;
  focusIndex: number | null;
  reducedMotion: boolean;
  compact?: boolean;
  onPositionSelect: (pos: FretboardPosition, index: number) => void;
  onCommit: (pos: FretboardPosition) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onCommitKey: () => void;
}

const ScalePathFretboard: React.FC<ScalePathFretboardProps> = ({
  fragment,
  selectedIndex,
  committedAnswer,
  correctAnswer,
  focusIndex,
  reducedMotion,
  compact = false,
  onPositionSelect,
  onCommit,
  onMoveLeft,
  onMoveRight,
  onCommitKey,
}) => {
  // Build revealed set: root anchor + suffix notes
  const revealedNotes = [
    fragment.anchor,
    ...(fragment.suffix ?? []),
  ].filter(Boolean) as ScalePathPosition[];

  // Candidates are the eligible positions
  const eligibleCandidates = (fragment.candidates ?? []).map((c) => ({
    ...c,
    string: (c as unknown as ScalePathPosition).string ?? (c as Record<string,unknown>).string as string,
    fret: (c as unknown as ScalePathPosition).fret ?? (c as Record<string,unknown>).fret as number,
    note: (c as unknown as ScalePathPosition).note ?? (c as Record<string,unknown>).note as string,
    stringIndex: (c as unknown as ScalePathPosition).stringIndex ?? (c as Record<string,unknown>).stringIndex as number,
    pitch: (c as unknown as ScalePathPosition).pitch ?? (c as Record<string,unknown>).pitch as number,
  })) as ScalePathPosition[];

  const selectedCandidate = selectedIndex !== null && selectedIndex < eligibleCandidates.length
    ? eligibleCandidates[selectedIndex]
    : null;

  // Build a flat position list for keyboard navigation (candidates only)
  const positions = eligibleCandidates;

  return (
    <ScaleFretboardBase
      fretCount={12}
      positions={positions}
      rootNote={fragment.root}
      revealedNotes={revealedNotes}
      eligibleCandidates={eligibleCandidates}
      selectedCandidate={selectedCandidate}
      committedAnswer={committedAnswer}
      correctAnswer={correctAnswer}
      selectedIndex={selectedIndex}
      focusIndex={focusIndex}
      reducedMotion={reducedMotion}
      compact={compact}
      onPositionSelect={onPositionSelect}
      onCommit={onCommit}
      onMoveLeft={onMoveLeft}
      onMoveRight={onMoveRight}
      onCommitKey={onCommitKey}
    />
  );
};

export default React.memo(ScalePathFretboard);
