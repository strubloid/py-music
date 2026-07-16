import React, { useMemo } from 'react';
import { guitarMidiAt, midiToNoteName, STANDARD_GUITAR_MIDI, type AccidentalPreference } from './musicMath';
import './game-instruments.scss';

export type InstrumentSelection = { midi: number; pitchClass: number; note: string; stringIndex?: number; fret?: number };

type Props = {
  activeMidi?: number[];
  legalMidi?: number[];
  rootPitchClass?: number;
  fretCount?: number;
  leftHanded?: boolean;
  showLabels?: boolean;
  accidental?: AccidentalPreference;
  disabled?: boolean;
  onSelect?: (selection: InstrumentSelection) => void;
};

const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

const GameGuitarFretboard = ({ activeMidi = [], legalMidi = [], rootPitchClass, fretCount = 24, leftHanded = false, showLabels = false, accidental = 'sharp', disabled = false, onSelect }: Props) => {
  const strings = useMemo(() => STANDARD_GUITAR_MIDI.map((openMidi, stringIndex) => ({ openMidi, stringIndex })), []);
  const active = new Set(activeMidi);
  const legal = new Set(legalMidi);
  return (
    <section className={`game-fretboard ${leftHanded ? 'is-left-handed' : ''}`} aria-label="Guitar fretboard">
      <div className="game-fretboard__overview" aria-hidden="true"><span style={{ width: `${Math.min(100, ((Math.max(...activeMidi, 0) - 40) / 48) * 100)}%` }} /></div>
      <div className="game-fretboard__scroll">
        <div className="game-fretboard__neck" style={{ '--frets': fretCount + 1 } as React.CSSProperties}>
          <div className="game-fretboard__markers" aria-hidden="true">
            {MARKERS.filter((fret) => fret <= fretCount).map((fret) => <i key={fret} className={fret === 12 ? 'double' : ''} style={{ '--marker-fret': fret } as React.CSSProperties} />)}
          </div>
          {strings.slice().reverse().map(({ stringIndex }) => (
            <div className="game-fretboard__string" key={stringIndex} style={{ '--string': stringIndex } as React.CSSProperties}>
              {Array.from({ length: fretCount + 1 }, (_, fret) => {
                const midi = guitarMidiAt(stringIndex, fret);
                const pitchClass = midi % 12;
                const note = midiToNoteName(midi, accidental);
                const isActive = active.has(midi);
                const isLegal = legal.has(midi);
                const isRoot = rootPitchClass === pitchClass;
                return (
                  <button
                    type="button"
                    key={fret}
                    className={`game-fretboard__note ${isActive ? 'is-active' : ''} ${isLegal ? 'is-legal' : ''} ${isRoot ? 'is-root' : ''}`}
                    aria-label={`String ${6 - stringIndex}, fret ${fret}, ${note}${isLegal ? ', legal destination' : ''}`}
                    aria-pressed={isActive}
                    disabled={disabled}
                    onClick={() => onSelect?.({ midi, pitchClass, note, stringIndex, fret })}
                  >
                    {showLabels && <span>{midiToNoteName(midi, accidental, false)}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(GameGuitarFretboard);
