// Centralized chord data and rendering logic
// This ensures consistent chord display across all components

export interface GuitarChordData {
  frets: string[];
  fingers: (number | null)[];
}

export interface PianoChordData {
  notes: string[];
}

export interface ChordRenderData {
  type: 'guitar' | 'piano';
  className: string;
  chordName: string;
  showTitle: boolean;
  // Guitar-specific props
  stringNames?: string[];
  chordData?: GuitarChordData;
  // Piano-specific props
  keyOrder?: string[];
  activeNotes?: string[];
}

class ChordDataService {
  // Guitar chord fingerings - fingerings are in order: E(1st), B(2nd), G(3rd), D(4th), A(5th), E(6th)
  // Comprehensive database with all common chord types
  private guitarChords: Record<string, GuitarChordData> = {
    // Major Chords
    'C': { frets: ['0', '1', '0', '2', '3', 'x'], fingers: [null, 1, null, 2, 3, null] },
    'C#': { frets: ['x', '4', '6', '6', '6', '4'], fingers: [null, 1, 3, 4, 2, 1] },
    'D': { frets: ['2', '3', '2', '0', 'x', 'x'], fingers: [1, 3, 2, null, null, null] },
    'D#': { frets: ['x', 'x', '1', '3', '4', '3'], fingers: [null, null, 1, 2, 4, 3] },
    'E': { frets: ['0', '0', '1', '2', '2', '0'], fingers: [null, null, 1, 3, 2, null] },
    'F': { frets: ['1', '1', '2', '3', '3', '1'], fingers: [1, 1, 2, 4, 3, 1] },
    'F#': { frets: ['2', '2', '3', '4', '4', '2'], fingers: [1, 1, 2, 4, 3, 1] },
    'G': { frets: ['3', '0', '0', '0', '2', '3'], fingers: [3, null, null, null, 2, 4] },
    'G#': { frets: ['4', '4', '5', '6', '6', '4'], fingers: [1, 1, 2, 4, 3, 1] },
    'A': { frets: ['0', '2', '2', '2', '0', 'x'], fingers: [null, 2, 3, 4, null, null] },
    'A#': { frets: ['1', '3', '3', '3', '1', 'x'], fingers: [1, 3, 4, 2, 1, null] },
    'B': { frets: ['2', '4', '4', '4', '2', 'x'], fingers: [1, 3, 4, 2, 1, null] },
    
    // Minor Chords
    'Cm': { frets: ['x', '3', '5', '5', '4', '3'], fingers: [null, 1, 3, 4, 2, 1] },
    'C#m': { frets: ['x', '4', '6', '6', '5', '4'], fingers: [null, 1, 3, 4, 2, 1] },
    'Dm': { frets: ['1', '3', '2', '0', 'x', 'x'], fingers: [1, 3, 2, null, null, null] },
    'D#m': { frets: ['x', 'x', '1', '3', '4', '2'], fingers: [null, null, 1, 3, 4, 2] },
    'Em': { frets: ['0', '0', '0', '2', '2', '0'], fingers: [null, null, null, 2, 3, null] },
    'Fm': { frets: ['1', '1', '1', '3', '4', '1'], fingers: [1, 1, 1, 3, 4, 1] },
    'F#m': { frets: ['2', '2', '2', '4', '5', '2'], fingers: [1, 1, 1, 3, 4, 1] },
    'Gm': { frets: ['3', '3', '3', '5', '6', '3'], fingers: [1, 1, 1, 3, 4, 1] },
    'G#m': { frets: ['4', '4', '4', '6', '7', '4'], fingers: [1, 1, 1, 3, 4, 1] },
    'Am': { frets: ['0', '1', '2', '2', '0', 'x'], fingers: [null, 1, 3, 2, null, null] },
    'A#m': { frets: ['1', '2', '3', '3', '1', 'x'], fingers: [1, 2, 4, 3, 1, null] },
    'Bm': { frets: ['2', '3', '4', '4', '2', 'x'], fingers: [1, 2, 4, 3, 1, null] },
    
    // Dominant 7th Chords
    'C7': { frets: ['0', '1', '3', '2', '3', 'x'], fingers: [null, 1, 4, 2, 3, null] },
    'C#7': { frets: ['x', '4', '3', '4', '2', 'x'], fingers: [null, 3, 2, 4, 1, null] },
    'D7': { frets: ['2', '1', '2', '0', 'x', 'x'], fingers: [2, 1, 3, null, null, null] },
    'D#7': { frets: ['x', 'x', '1', '0', '2', '3'], fingers: [null, null, 1, null, 2, 4] },
    'E7': { frets: ['0', '0', '1', '0', '2', '0'], fingers: [null, null, 1, null, 2, null] },
    'F7': { frets: ['1', '1', '2', '1', '3', '1'], fingers: [1, 1, 2, 1, 3, 1] },
    'F#7': { frets: ['2', '2', '3', '2', '4', '2'], fingers: [1, 1, 2, 1, 3, 1] },
    'G7': { frets: ['1', '0', '0', '0', '2', '3'], fingers: [1, null, null, null, 2, 3] },
    'G#7': { frets: ['4', '4', '5', '4', '6', '4'], fingers: [1, 1, 2, 1, 3, 1] },
    'A7': { frets: ['0', '2', '0', '2', '0', 'x'], fingers: [null, 2, null, 3, null, null] },
    'A#7': { frets: ['1', '3', '1', '3', '1', 'x'], fingers: [1, 3, 1, 4, 1, null] },
    'B7': { frets: ['2', '0', '2', '1', '2', 'x'], fingers: [2, null, 3, 1, 4, null] },
    
    // Major 7th Chords
    'Cmaj7': { frets: ['0', '0', '0', '2', '3', 'x'], fingers: [null, null, null, 2, 3, null] },
    'C#maj7': { frets: ['x', '4', '3', '5', '6', 'x'], fingers: [null, 2, 1, 3, 4, null] },
    'Dmaj7': { frets: ['2', '2', '2', '0', 'x', 'x'], fingers: [2, 3, 1, null, null, null] },
    'D#maj7': { frets: ['x', 'x', '1', '0', '3', '3'], fingers: [null, null, 1, null, 3, 4] },
    'Emaj7': { frets: ['0', '0', '1', '1', '2', '0'], fingers: [null, null, 1, 2, 3, null] },
    'Fmaj7': { frets: ['0', '1', '2', '3', 'x', 'x'], fingers: [null, 1, 2, 3, null, null] },
    'F#maj7': { frets: ['2', '1', '3', '3', 'x', 'x'], fingers: [2, 1, 3, 4, null, null] },
    'Gmaj7': { frets: ['2', '0', '0', '0', '2', '3'], fingers: [2, null, null, null, 3, 4] },
    'G#maj7': { frets: ['4', '3', '5', '5', 'x', 'x'], fingers: [2, 1, 3, 4, null, null] },
    'Amaj7': { frets: ['0', '2', '1', '2', '0', 'x'], fingers: [null, 3, 1, 2, null, null] },
    'A#maj7': { frets: ['1', '3', '2', '3', '1', 'x'], fingers: [1, 4, 2, 3, 1, null] },
    'Bmaj7': { frets: ['2', '4', '3', '4', '2', 'x'], fingers: [1, 4, 2, 3, 1, null] },
    
    // Minor 7th Chords
    'Cm7': { frets: ['x', '3', '1', '3', '4', '3'], fingers: [null, 2, 1, 3, 4, 2] },
    'C#m7': { frets: ['x', '4', '2', '4', '5', '4'], fingers: [null, 2, 1, 3, 4, 2] },
    'Dm7': { frets: ['x', '5', '3', '5', '6', '5'], fingers: [null, 2, 1, 3, 4, 2] },
    'D#m7': { frets: ['x', 'x', '1', '3', '2', '2'], fingers: [null, null, 1, 4, 2, 3] },
    'Em7': { frets: ['0', '0', '0', '0', '2', '0'], fingers: [null, null, null, null, 2, null] },
    'Fm7': { frets: ['1', '1', '1', '1', '3', '1'], fingers: [1, 1, 1, 1, 3, 1] },
    'F#m7': { frets: ['2', '2', '2', '2', '4', '2'], fingers: [1, 1, 1, 1, 3, 1] },
    'Gm7': { frets: ['3', '3', '3', '3', '5', '3'], fingers: [1, 1, 1, 1, 3, 1] },
    'G#m7': { frets: ['4', '4', '4', '4', '6', '4'], fingers: [1, 1, 1, 1, 3, 1] },
    'Am7': { frets: ['0', '1', '0', '2', '0', 'x'], fingers: [null, 1, null, 2, null, null] },
    'A#m7': { frets: ['1', '2', '1', '3', '1', 'x'], fingers: [1, 2, 1, 3, 1, null] },
    'Bm7': { frets: ['2', '3', '2', '4', '2', 'x'], fingers: [1, 2, 1, 3, 1, null] },
    
    // Diminished Chords
    'Cdim': { frets: ['x', '3', '4', '2', 'x', 'x'], fingers: [null, 2, 3, 1, null, null] },
    'C#dim': { frets: ['x', '4', '5', '3', 'x', 'x'], fingers: [null, 2, 3, 1, null, null] },
    'Ddim': { frets: ['x', 'x', '0', '1', '0', '1'], fingers: [null, null, null, 1, null, 2] },
    'D#dim': { frets: ['x', 'x', '1', '2', '1', '2'], fingers: [null, null, 1, 3, 2, 4] },
    'Edim': { frets: ['x', 'x', '2', '3', '2', '3'], fingers: [null, null, 1, 3, 2, 4] },
    'Fdim': { frets: ['x', 'x', '3', '4', '3', '4'], fingers: [null, null, 1, 3, 2, 4] },
    'F#dim': { frets: ['x', 'x', '4', '5', '4', '5'], fingers: [null, null, 1, 3, 2, 4] },
    'Gdim': { frets: ['x', 'x', '5', '6', '5', '6'], fingers: [null, null, 1, 3, 2, 4] },
    'G#dim': { frets: ['x', 'x', '6', '7', '6', '7'], fingers: [null, null, 1, 3, 2, 4] },
    'Adim': { frets: ['x', '0', '1', '2', '1', 'x'], fingers: [null, null, 1, 3, 2, null] },
    'A#dim': { frets: ['x', '1', '2', '3', '2', 'x'], fingers: [null, 1, 2, 4, 3, null] },
    'Bdim': { frets: ['x', '2', '3', '4', '3', 'x'], fingers: [null, 1, 2, 4, 3, null] },
    
    // Augmented Chords
    'Caug': { frets: ['x', '3', '2', '1', '1', '0'], fingers: [null, 4, 3, 2, 1, null] },
    'C#aug': { frets: ['x', '4', '3', '2', '2', '1'], fingers: [null, 4, 3, 2, 2, 1] },
    'Daug': { frets: ['x', 'x', '0', '3', '3', '2'], fingers: [null, null, null, 3, 4, 2] },
    'D#aug': { frets: ['x', 'x', '1', '4', '4', '3'], fingers: [null, null, 1, 3, 4, 2] },
    'Eaug': { frets: ['0', '3', '2', '1', '1', '0'], fingers: [null, 4, 3, 2, 1, null] },
    'Faug': { frets: ['x', 'x', '3', '2', '2', '1'], fingers: [null, null, 4, 2, 3, 1] },
    'F#aug': { frets: ['x', 'x', '4', '3', '3', '2'], fingers: [null, null, 4, 2, 3, 1] },
    'Gaug': { frets: ['3', '2', '1', '0', '0', '3'], fingers: [4, 3, 2, null, null, 4] },
    'G#aug': { frets: ['4', '3', '2', '1', '1', '4'], fingers: [4, 3, 2, 1, 1, 4] },
    'Aaug': { frets: ['x', '0', '3', '2', '2', '1'], fingers: [null, null, 4, 2, 3, 1] },
    'A#aug': { frets: ['x', '1', '4', '3', '3', '2'], fingers: [null, 1, 4, 2, 3, 2] },
    'Baug': { frets: ['x', '2', '5', '4', '4', '3'], fingers: [null, 1, 4, 2, 3, 2] },
    
    // Suspended 2nd Chords
    'Csus2': { frets: ['x', '3', '0', '0', '1', '3'], fingers: [null, 3, null, null, 1, 4] },
    'C#sus2': { frets: ['x', '4', '1', '1', '2', '4'], fingers: [null, 3, 1, 1, 2, 4] },
    'Dsus2': { frets: ['x', '5', '2', '2', '3', '5'], fingers: [null, 3, 1, 1, 2, 4] },
    'D#sus2': { frets: ['x', 'x', '1', '3', '4', '1'], fingers: [null, null, 1, 3, 4, 1] },
    'Esus2': { frets: ['0', '2', '4', '4', '0', '0'], fingers: [null, 1, 3, 4, null, null] },
    'Fsus2': { frets: ['x', 'x', '3', '0', '1', '1'], fingers: [null, null, 3, null, 1, 2] },
    'F#sus2': { frets: ['x', 'x', '4', '1', '2', '2'], fingers: [null, null, 4, 1, 2, 3] },
    'Gsus2': { frets: ['3', '0', '0', '2', '3', '3'], fingers: [2, null, null, 1, 3, 4] },
    'G#sus2': { frets: ['x', 'x', '6', '3', '4', '4'], fingers: [null, null, 4, 1, 2, 3] },
    'Asus2': { frets: ['0', '0', '2', '2', '0', '0'], fingers: [null, null, 2, 3, null, null] },
    'A#sus2': { frets: ['x', '1', '3', '3', '1', '1'], fingers: [null, 1, 3, 4, 1, 1] },
    'Bsus2': { frets: ['x', '2', '4', '4', '2', '2'], fingers: [null, 1, 3, 4, 1, 1] },
    
    // Suspended 4th Chords
    'Csus4': { frets: ['x', '3', '3', '0', '1', '1'], fingers: [null, 3, 4, null, 1, 2] },
    'C#sus4': { frets: ['x', '4', '4', '1', '2', '2'], fingers: [null, 3, 4, 1, 1, 2] },
    'Dsus4': { frets: ['x', '5', '5', '2', '3', '3'], fingers: [null, 3, 4, 1, 1, 2] },
    'D#sus4': { frets: ['x', 'x', '1', '3', '4', '4'], fingers: [null, null, 1, 2, 3, 4] },
    'Esus4': { frets: ['0', '0', '2', '2', '0', '0'], fingers: [null, null, 2, 3, null, null] },
    'Fsus4': { frets: ['x', 'x', '3', '3', '1', '1'], fingers: [null, null, 3, 4, 1, 2] },
    'F#sus4': { frets: ['x', 'x', '4', '4', '2', '2'], fingers: [null, null, 3, 4, 1, 2] },
    'Gsus4': { frets: ['3', '3', '0', '0', '1', '3'], fingers: [3, 4, null, null, 1, 3] },
    'G#sus4': { frets: ['4', '4', '6', '6', '4', '4'], fingers: [1, 1, 3, 4, 1, 1] },
    'Asus4': { frets: ['0', '0', '2', '2', '3', '0'], fingers: [null, null, 2, 3, 4, null] },
    'A#sus4': { frets: ['x', '1', '3', '3', '4', '1'], fingers: [null, 1, 3, 3, 4, 1] },
    'Bsus4': { frets: ['x', '2', '4', '4', '5', '2'], fingers: [null, 1, 3, 3, 4, 1] },
    
    // Add9 Chords
    'Cadd9': { frets: ['x', '3', '2', '0', '3', '0'], fingers: [null, 3, 2, null, 4, null] },
    'Dadd9': { frets: ['x', '5', '4', '2', '3', '0'], fingers: [null, 4, 3, 1, 2, null] },
    'Eadd9': { frets: ['0', '2', '4', '1', '0', '0'], fingers: [null, 2, 4, 1, null, null] },
    'Fadd9': { frets: ['x', 'x', '3', '2', '1', '3'], fingers: [null, null, 4, 3, 1, 4] },
    'Gadd9': { frets: ['3', '0', '0', '2', '0', '3'], fingers: [3, null, null, 2, null, 4] },
    'Aadd9': { frets: ['x', '0', '2', '4', '2', '0'], fingers: [null, null, 1, 4, 2, null] },
    'Badd9': { frets: ['x', '2', '1', '4', '2', '2'], fingers: [null, 2, 1, 4, 2, 3] },
    
    // Power Chords (5)
    'C5': { frets: ['x', '3', 'x', '0', '1', 'x'], fingers: [null, 3, null, null, 1, null] },
    'D5': { frets: ['x', '5', 'x', '2', '3', 'x'], fingers: [null, 3, null, 1, 2, null] },
    'E5': { frets: ['0', '2', 'x', 'x', '0', '0'], fingers: [null, 2, null, null, null, null] },
    'F5': { frets: ['1', '3', 'x', 'x', '1', '1'], fingers: [1, 3, null, null, 1, 1] },
    'G5': { frets: ['3', '5', 'x', 'x', '3', '3'], fingers: [1, 3, null, null, 1, 1] },
    'A5': { frets: ['0', '2', 'x', 'x', '0', 'x'], fingers: [null, 2, null, null, null, null] },
    'B5': { frets: ['x', '2', 'x', 'x', '4', 'x'], fingers: [null, 1, null, null, 3, null] },
    
    // Minor Major 7th Chords (mM7)
    'CmM7': { frets: ['x', '3', '1', '0', '4', 'x'], fingers: [null, 3, 1, null, 4, null] },
    'DmM7': { frets: ['x', '5', '3', '2', '6', 'x'], fingers: [null, 3, 2, 1, 4, null] },
    'EmM7': { frets: ['0', '2', '1', '0', '0', '0'], fingers: [null, 3, 1, null, null, null] },
    'FmM7': { frets: ['1', '3', '2', '1', '1', '1'], fingers: [1, 4, 2, 1, 1, 1] },
    'GmM7': { frets: ['3', '5', '4', '3', '3', '3'], fingers: [1, 4, 2, 1, 1, 1] },
    'AmM7': { frets: ['x', '0', '2', '1', '1', '0'], fingers: [null, null, 4, 2, 3, null] },
    'BmM7': { frets: ['x', '2', '4', '3', '3', '2'], fingers: [null, 1, 4, 2, 3, 1] },
    
    // 6th Chords
    'C6': { frets: ['x', '3', '2', '2', '1', '0'], fingers: [null, 4, 3, 2, 1, null] },
    'D6': { frets: ['x', '5', '4', '4', '3', '0'], fingers: [null, 4, 3, 3, 2, null] },
    'E6': { frets: ['0', '2', '2', '1', '2', '0'], fingers: [null, 2, 3, 1, 4, null] },
    'F6': { frets: ['x', 'x', '3', '5', '3', '5'], fingers: [null, null, 1, 3, 2, 4] },
    'G6': { frets: ['3', '2', '0', '0', '0', '0'], fingers: [3, 2, null, null, null, null] },
    'A6': { frets: ['x', '0', '2', '2', '2', '2'], fingers: [null, null, 1, 2, 3, 4] },
    'B6': { frets: ['x', '2', '1', '1', '1', '2'], fingers: [null, 3, 1, 1, 1, 4] },
    
    // 9th Chords
    'C9': { frets: ['x', '3', '2', '3', '3', '3'], fingers: [null, 2, 1, 3, 3, 4] },
    'D9': { frets: ['x', '5', '4', '5', '5', '5'], fingers: [null, 2, 1, 3, 3, 4] },
    'E9': { frets: ['0', '2', '0', '1', '0', '2'], fingers: [null, 2, null, 1, null, 3] },
    'F9': { frets: ['1', '3', '1', '2', '1', '3'], fingers: [1, 3, 1, 2, 1, 4] },
    'G9': { frets: ['3', '2', '0', '2', '0', '1'], fingers: [4, 2, null, 3, null, 1] },
    'A9': { frets: ['x', '0', '2', '4', '2', '3'], fingers: [null, null, 1, 3, 2, 4] },
    'B9': { frets: ['x', '2', '1', '2', '2', '2'], fingers: [null, 2, 1, 3, 3, 4] }
  };

  // Piano chord definitions - comprehensive database with all common chord types
  // Using consistent sharp notation (# instead of b) for internal representation
  private pianoChords: Record<string, string[]> = {
    // Major Chords (Root + Major 3rd + Perfect 5th)
    'C': ['C', 'E', 'G'],
    'C#': ['C#', 'F', 'G#'],
    'D': ['D', 'F#', 'A'],
    'D#': ['D#', 'G', 'A#'],
    'E': ['E', 'G#', 'B'],
    'F': ['F', 'A', 'C'],
    'F#': ['F#', 'A#', 'C#'],
    'G': ['G', 'B', 'D'],
    'G#': ['G#', 'C', 'D#'],
    'A': ['A', 'C#', 'E'],
    'A#': ['A#', 'D', 'F'],
    'B': ['B', 'D#', 'F#'],
    
    // Minor Chords (Root + Minor 3rd + Perfect 5th)
    'Cm': ['C', 'D#', 'G'],      // C + Eb + G
    'C#m': ['C#', 'E', 'G#'],    // C# + E + G#
    'Dm': ['D', 'F', 'A'],       // D + F + A
    'D#m': ['D#', 'F#', 'A#'],   // D# + F# + A#
    'Em': ['E', 'G', 'B'],       // E + G + B
    'Fm': ['F', 'G#', 'C'],      // F + Ab + C
    'F#m': ['F#', 'A', 'C#'],    // F# + A + C#
    'Gm': ['G', 'A#', 'D'],      // G + Bb + D
    'G#m': ['G#', 'B', 'D#'],    // G# + B + D#
    'Am': ['A', 'C', 'E'],       // A + C + E
    'A#m': ['A#', 'C#', 'F'],    // A# + C# + F
    'Bm': ['B', 'D', 'F#'],      // B + D + F#
    
    // Diminished Chords (Root + Minor 3rd + Diminished 5th)
    'Cdim': ['C', 'D#', 'F#'],
    'C#dim': ['C#', 'E', 'G'],
    'Ddim': ['D', 'F', 'G#'],
    'D#dim': ['D#', 'F#', 'A'],
    'Edim': ['E', 'G', 'A#'],
    'Fdim': ['F', 'G#', 'B'],
    'F#dim': ['F#', 'A', 'C'],
    'Gdim': ['G', 'A#', 'C#'],
    'G#dim': ['G#', 'B', 'D'],
    'Adim': ['A', 'C', 'D#'],
    'A#dim': ['A#', 'C#', 'E'],
    'Bdim': ['B', 'D', 'F'],
    
    // Augmented Chords (Root + Major 3rd + Augmented 5th)
    'Caug': ['C', 'E', 'G#'],
    'C#aug': ['C#', 'F', 'A'],
    'Daug': ['D', 'F#', 'A#'],
    'D#aug': ['D#', 'G', 'B'],
    'Eaug': ['E', 'G#', 'C'],
    'Faug': ['F', 'A', 'C#'],
    'F#aug': ['F#', 'A#', 'D'],
    'Gaug': ['G', 'B', 'D#'],
    'G#aug': ['G#', 'C', 'E'],
    'Aaug': ['A', 'C#', 'F'],
    'A#aug': ['A#', 'D', 'F#'],
    'Baug': ['B', 'D#', 'G'],
    
    // Dominant 7th Chords (Root + Major 3rd + Perfect 5th + Minor 7th)
    'C7': ['C', 'E', 'G', 'A#'],
    'C#7': ['C#', 'F', 'G#', 'B'],
    'D7': ['D', 'F#', 'A', 'C'],
    'D#7': ['D#', 'G', 'A#', 'C#'],
    'E7': ['E', 'G#', 'B', 'D'],
    'F7': ['F', 'A', 'C', 'D#'],
    'F#7': ['F#', 'A#', 'C#', 'E'],
    'G7': ['G', 'B', 'D', 'F'],
    'G#7': ['G#', 'C', 'D#', 'F#'],
    'A7': ['A', 'C#', 'E', 'G'],
    'A#7': ['A#', 'D', 'F', 'G#'],
    'B7': ['B', 'D#', 'F#', 'A'],
    
    // Major 7th Chords (Root + Major 3rd + Perfect 5th + Major 7th)
    'Cmaj7': ['C', 'E', 'G', 'B'],
    'C#maj7': ['C#', 'F', 'G#', 'C'],
    'Dmaj7': ['D', 'F#', 'A', 'C#'],
    'D#maj7': ['D#', 'G', 'A#', 'D'],
    'Emaj7': ['E', 'G#', 'B', 'D#'],
    'Fmaj7': ['F', 'A', 'C', 'E'],
    'F#maj7': ['F#', 'A#', 'C#', 'F'],
    'Gmaj7': ['G', 'B', 'D', 'F#'],
    'G#maj7': ['G#', 'C', 'D#', 'G'],
    'Amaj7': ['A', 'C#', 'E', 'G#'],
    'A#maj7': ['A#', 'D', 'F', 'A'],
    'Bmaj7': ['B', 'D#', 'F#', 'A#'],
    
    // Minor 7th Chords (Root + Minor 3rd + Perfect 5th + Minor 7th)
    'Cm7': ['C', 'D#', 'G', 'A#'],
    'C#m7': ['C#', 'E', 'G#', 'B'],
    'Dm7': ['D', 'F', 'A', 'C'],
    'D#m7': ['D#', 'F#', 'A#', 'C#'],
    'Em7': ['E', 'G', 'B', 'D'],
    'Fm7': ['F', 'G#', 'C', 'D#'],
    'F#m7': ['F#', 'A', 'C#', 'E'],
    'Gm7': ['G', 'A#', 'D', 'F'],
    'G#m7': ['G#', 'B', 'D#', 'F#'],
    'Am7': ['A', 'C', 'E', 'G'],
    'A#m7': ['A#', 'C#', 'F', 'G#'],
    'Bm7': ['B', 'D', 'F#', 'A'],
    
    // Minor Major 7th Chords (Root + Minor 3rd + Perfect 5th + Major 7th)
    'CmM7': ['C', 'D#', 'G', 'B'],
    'C#mM7': ['C#', 'E', 'G#', 'C'],
    'DmM7': ['D', 'F', 'A', 'C#'],
    'D#mM7': ['D#', 'F#', 'A#', 'D'],
    'EmM7': ['E', 'G', 'B', 'D#'],
    'FmM7': ['F', 'G#', 'C', 'E'],
    'F#mM7': ['F#', 'A', 'C#', 'F'],
    'GmM7': ['G', 'A#', 'D', 'F#'],
    'G#mM7': ['G#', 'B', 'D#', 'G'],
    'AmM7': ['A', 'C', 'E', 'G#'],
    'A#mM7': ['A#', 'C#', 'F', 'A'],
    'BmM7': ['B', 'D', 'F#', 'A#'],
    
    // 6th Chords (Root + Major 3rd + Perfect 5th + Major 6th)
    'C6': ['C', 'E', 'G', 'A'],
    'D6': ['D', 'F#', 'A', 'B'],
    'E6': ['E', 'G#', 'B', 'C#'],
    'F6': ['F', 'A', 'C', 'D'],
    'G6': ['G', 'B', 'D', 'E'],
    'A6': ['A', 'C#', 'E', 'F#'],
    'B6': ['B', 'D#', 'F#', 'G#'],
    
    // Minor 6th Chords (Root + Minor 3rd + Perfect 5th + Major 6th)
    'Cm6': ['C', 'D#', 'G', 'A'],
    'Dm6': ['D', 'F', 'A', 'B'],
    'Em6': ['E', 'G', 'B', 'C#'],
    'Fm6': ['F', 'G#', 'C', 'D'],
    'Gm6': ['G', 'A#', 'D', 'E'],
    'Am6': ['A', 'C', 'E', 'F#'],
    'Bm6': ['B', 'D', 'F#', 'G#'],
    
    // 6/9 Chords (6th with added 9th)
    'C6/9': ['C', 'E', 'G', 'A', 'D'],
    'D6/9': ['D', 'F#', 'A', 'B', 'E'],
    'E6/9': ['E', 'G#', 'B', 'C#', 'F#'],
    'F6/9': ['F', 'A', 'C', 'D', 'G'],
    'G6/9': ['G', 'B', 'D', 'E', 'A'],
    'A6/9': ['A', 'C#', 'E', 'F#', 'B'],
    
    // 9th Chords (Root + Major 3rd + Perfect 5th + Minor 7th + Major 9th)
    'C9': ['C', 'E', 'G', 'A#', 'D'],
    'D9': ['D', 'F#', 'A', 'C', 'E'],
    'E9': ['E', 'G#', 'B', 'D', 'F#'],
    'F9': ['F', 'A', 'C', 'D#', 'G'],
    'G9': ['G', 'B', 'D', 'F', 'A'],
    'A9': ['A', 'C#', 'E', 'G', 'B'],
    'B9': ['B', 'D#', 'F#', 'A', 'C#'],
    
    // Minor 9th Chords (Root + Minor 3rd + Perfect 5th + Minor 7th + Major 9th)
    'Cm9': ['C', 'D#', 'G', 'A#', 'D'],
    'Dm9': ['D', 'F', 'A', 'C', 'E'],
    'Em9': ['E', 'G', 'B', 'D', 'F#'],
    'Fm9': ['F', 'G#', 'C', 'D#', 'G'],
    'Gm9': ['G', 'A#', 'D', 'F', 'A'],
    'Am9': ['A', 'C', 'E', 'G', 'B'],
    'Bm9': ['B', 'D', 'F#', 'A', 'C#'],
    
    // Major 9th Chords (Root + Major 3rd + Perfect 5th + Major 7th + Major 9th)
    'Cmaj9': ['C', 'E', 'G', 'B', 'D'],
    'Dmaj9': ['D', 'F#', 'A', 'C#', 'E'],
    'Emaj9': ['E', 'G#', 'B', 'D#', 'F#'],
    'Fmaj9': ['F', 'A', 'C', 'E', 'G'],
    'Gmaj9': ['G', 'B', 'D', 'F#', 'A'],
    'Amaj9': ['A', 'C#', 'E', 'G#', 'B'],
    'Bmaj9': ['B', 'D#', 'F#', 'A#', 'C#'],
    
    // 11th Chords (Root + 3rd + 5th + 7th + 9th + 11th)
    'C11': ['C', 'E', 'G', 'A#', 'D', 'F'],
    'D11': ['D', 'F#', 'A', 'C', 'E', 'G'],
    'E11': ['E', 'G#', 'B', 'D', 'F#', 'A'],
    'F11': ['F', 'A', 'C', 'D#', 'G', 'A#'],
    'G11': ['G', 'B', 'D', 'F', 'A', 'C'],
    'A11': ['A', 'C#', 'E', 'G', 'B', 'D'],
    
    // Minor 11th Chords
    'Cm11': ['C', 'D#', 'G', 'A#', 'D', 'F'],
    'Dm11': ['D', 'F', 'A', 'C', 'E', 'G'],
    'Em11': ['E', 'G', 'B', 'D', 'F#', 'A'],
    'Fm11': ['F', 'G#', 'C', 'D#', 'G', 'A#'],
    'Gm11': ['G', 'A#', 'D', 'F', 'A', 'C'],
    'Am11': ['A', 'C', 'E', 'G', 'B', 'D'],
    
    // 13th Chords (Root + 3rd + 5th + 7th + 9th + 13th)
    'C13': ['C', 'E', 'G', 'A#', 'D', 'A'],
    'D13': ['D', 'F#', 'A', 'C', 'E', 'B'],
    'E13': ['E', 'G#', 'B', 'D', 'F#', 'C#'],
    'F13': ['F', 'A', 'C', 'D#', 'G', 'D'],
    'G13': ['G', 'B', 'D', 'F', 'A', 'E'],
    'A13': ['A', 'C#', 'E', 'G', 'B', 'F#'],
    
    // Minor 13th Chords
    'Cm13': ['C', 'D#', 'G', 'A#', 'D', 'A'],
    'Dm13': ['D', 'F', 'A', 'C', 'E', 'B'],
    'Em13': ['E', 'G', 'B', 'D', 'F#', 'C#'],
    'Fm13': ['F', 'G#', 'C', 'D#', 'G', 'D'],
    'Gm13': ['G', 'A#', 'D', 'F', 'A', 'E'],
    'Am13': ['A', 'C', 'E', 'G', 'B', 'F#'],
    
    // Major 13th Chords
    'Cmaj13': ['C', 'E', 'G', 'B', 'D', 'A'],
    'Dmaj13': ['D', 'F#', 'A', 'C#', 'E', 'B'],
    'Emaj13': ['E', 'G#', 'B', 'D#', 'F#', 'C#'],
    'Fmaj13': ['F', 'A', 'C', 'E', 'G', 'D'],
    'Gmaj13': ['G', 'B', 'D', 'F#', 'A', 'E'],
    'Amaj13': ['A', 'C#', 'E', 'G#', 'B', 'F#'],
    
    // Suspended 2nd Chords (Root + Major 2nd + Perfect 5th)
    'Csus2': ['C', 'D', 'G'],
    'C#sus2': ['C#', 'D#', 'G#'],
    'Dsus2': ['D', 'E', 'A'],
    'D#sus2': ['D#', 'F', 'A#'],
    'Esus2': ['E', 'F#', 'B'],
    'Fsus2': ['F', 'G', 'C'],
    'F#sus2': ['F#', 'G#', 'C#'],
    'Gsus2': ['G', 'A', 'D'],
    'G#sus2': ['G#', 'A#', 'D#'],
    'Asus2': ['A', 'B', 'E'],
    'A#sus2': ['A#', 'C', 'F'],
    'Bsus2': ['B', 'C#', 'F#'],
    
    // Suspended 4th Chords (Root + Perfect 4th + Perfect 5th)
    'Csus4': ['C', 'F', 'G'],
    'C#sus4': ['C#', 'F#', 'G#'],
    'Dsus4': ['D', 'G', 'A'],
    'D#sus4': ['D#', 'G#', 'A#'],
    'Esus4': ['E', 'A', 'B'],
    'Fsus4': ['F', 'A#', 'C'],
    'F#sus4': ['F#', 'B', 'C#'],
    'Gsus4': ['G', 'C', 'D'],
    'G#sus4': ['G#', 'C#', 'D#'],
    'Asus4': ['A', 'D', 'E'],
    'A#sus4': ['A#', 'D#', 'F'],
    'Bsus4': ['B', 'E', 'F#'],
    
    // Add9 Chords (Root + Major 3rd + Perfect 5th + Major 9th)
    'Cadd9': ['C', 'E', 'G', 'D'],
    'Dadd9': ['D', 'F#', 'A', 'E'],
    'Eadd9': ['E', 'G#', 'B', 'F#'],
    'Fadd9': ['F', 'A', 'C', 'G'],
    'Gadd9': ['G', 'B', 'D', 'A'],
    'Aadd9': ['A', 'C#', 'E', 'B'],
    'Badd9': ['B', 'D#', 'F#', 'C#'],
    
    // Power Chords (Root + Perfect 5th)
    'C5': ['C', 'G'],
    'D5': ['D', 'A'],
    'E5': ['E', 'B'],
    'F5': ['F', 'C'],
    'G5': ['G', 'D'],
    'A5': ['A', 'E'],
    'B5': ['B', 'F#']
  };

  // String names for guitar (standard tuning)
  public readonly guitarStringNames: string[] = ['E', 'B', 'G', 'D', 'A', 'E'];
  
  // Piano key order (one octave)
  public readonly pianoKeyOrder: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Get chord data for guitar
  getGuitarChordData(chordName: string): GuitarChordData {
    return this.guitarChords[chordName] || this.guitarChords['C'];
  }

  // Get chord data for piano
  getPianoChordData(chordName: string): string[] {
    return this.pianoChords[chordName] || this.pianoChords['C'];
  }

  // Check if chord exists in our database
  hasChord(chordName: string): boolean {
    return this.guitarChords.hasOwnProperty(chordName) && this.pianoChords.hasOwnProperty(chordName);
  }

  // Get all available chord names
  getAllChordNames(): string[] {
    return Object.keys(this.guitarChords);
  }

  // Render guitar fretboard data structure
  renderGuitarFretboard(chordName: string, options: { className?: string; showTitle?: boolean } = {}): ChordRenderData {
    const chordData = this.getGuitarChordData(chordName);
    const className = options.className || '';
    const showTitle = options.showTitle !== false;
    
    return {
      type: 'guitar',
      className: `guitar-chord-diagram ${className}`,
      chordName,
      stringNames: this.guitarStringNames,
      chordData,
      showTitle
    };
  }

  // Render piano keys data structure
  renderPianoKeys(chordName: string, options: { className?: string; showTitle?: boolean } = {}): ChordRenderData {
    const notes = this.getPianoChordData(chordName);
    const className = options.className || '';
    const showTitle = options.showTitle !== false;
    
    return {
      type: 'piano',
      className: `piano-chord-display ${className}`,
      chordName,
      keyOrder: this.pianoKeyOrder,
      activeNotes: notes,
      showTitle
    };
  }

  // Get chord rendering data based on display mode
  getChordRenderData(chordName: string, displayMode: 'guitar' | 'piano' = 'guitar', options: { className?: string; showTitle?: boolean } = {}): ChordRenderData {
    if (displayMode === 'piano') {
      return this.renderPianoKeys(chordName, options);
    } else {
      return this.renderGuitarFretboard(chordName, options);
    }
  }
}

// Create and export singleton instance
const chordDataService = new ChordDataService();
export default chordDataService;