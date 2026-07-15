// Scale Lab Builder Fretboard — interactive fretboard for Scale Lab
import React, { useCallback, useMemo } from 'react';
import ScaleFretboardBase, { type FretboardPosition } from './ScaleFretboardBase';
import type { LabPosition } from '../state/scaleLabReducer';

interface ScaleBuilderFretboardProps {
  fretCount: number;
  positions: FretboardPosition[];
  placedNotes: LabPosition[];
  missingNotes?: LabPosition[];
  nonTargetNotes?: LabPosition[];
  targetMode?: string;
  targetRoot?: string;
  selectedPositions: LabPosition[];
  reducedMotion: boolean;
  onPositionToggle: (pos: LabPosition) => void;
  onClearAll: () => void;
}

const ScaleBuilderFretboard: React.FC<ScaleBuilderFretboardProps> = ({
  fretCount,
  positions,
  placedNotes,
  missingNotes = [],
  nonTargetNotes = [],
  selectedPositions,
  reducedMotion,
  onPositionToggle,
}) => {
  const placedSet = useMemo(
    () => new Set(placedNotes.map((p) => `${p.string}-${p.fret}`)),
    [placedNotes],
  );
  const missingSet = useMemo(
    () => new Set(missingNotes.map((p) => `${p.string}-${p.fret}`)),
    [missingNotes],
  );
  const nonTargetSet = useMemo(
    () => new Set(nonTargetNotes.map((p) => `${p.string}-${p.fret}`)),
    [nonTargetNotes],
  );

  const handleSelect = useCallback(
    (pos: FretboardPosition) => {
      const labPos: LabPosition = {
        string: pos.string,
        fret: pos.fret,
        note: pos.note,
        stringIndex: pos.stringIndex,
        pitch: pos.pitch,
      };
      onPositionToggle(labPos);
    },
    [onPositionToggle],
  );

  return (
    <ScaleFretboardBase
      fretCount={fretCount}
      positions={positions}
      placedNotes={placedNotes}
      missingNotes={missingNotes}
      nonTargetNotes={nonTargetNotes}
      rootNote={undefined}
      reducedMotion={reducedMotion}
      compact={false}
      onPositionSelect={handleSelect}
    />
  );
};

export default React.memo(ScaleBuilderFretboard);
