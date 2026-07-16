export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const STANDARD_GUITAR_MIDI = [40, 45, 50, 55, 59, 64] as const;

export type AccidentalPreference = 'sharp' | 'flat';

export const midiToPitchClass = (midi: number) => ((Math.round(midi) % 12) + 12) % 12;

export const midiToNoteName = (midi: number, accidental: AccidentalPreference = 'sharp', includeOctave = true) => {
  const safeMidi = Math.round(midi);
  const names = accidental === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  const name = names[midiToPitchClass(safeMidi)];
  return includeOctave ? `${name}${Math.floor(safeMidi / 12) - 1}` : name;
};

export const guitarMidiAt = (stringIndex: number, fret: number, tuning: readonly number[] = STANDARD_GUITAR_MIDI) => {
  if (!Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex >= tuning.length) {
    throw new RangeError('Guitar string index is outside the tuning.');
  }
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
    throw new RangeError('Guitar fret must be an integer from 0 through 24.');
  }
  return tuning[stringIndex] + fret;
};

export const isBlackPianoMidi = (midi: number) => [1, 3, 6, 8, 10].includes(midiToPitchClass(midi));

export const pianoRange = (startMidi = 48, endMidi = 72) => {
  if (midiToPitchClass(startMidi) !== 0 || midiToPitchClass(endMidi) !== 0 || endMidi <= startMidi) {
    throw new RangeError('Piano range must remain an ascending C-to-C span.');
  }
  return Array.from({ length: endMidi - startMidi + 1 }, (_, index) => startMidi + index);
};
