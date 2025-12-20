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
  private guitarChords: Record<string, GuitarChordData> = {
    'C': { frets: ['0', '1', '0', '2', '3', 'x'], fingers: [null, 1, null, 2, 3, null] },
    'Dm': { frets: ['1', '3', '2', '0', 'x', 'x'], fingers: [1, 3, 2, null, null, null] },
    'Em': { frets: ['0', '0', '0', '2', '2', '0'], fingers: [null, null, null, 2, 3, null] },
    'F': { frets: ['1', '1', '2', '3', '3', '1'], fingers: [1, 1, 2, 4, 3, 1] },
    'G': { frets: ['3', '3', '0', '0', '2', '3'], fingers: [4, 4, null, null, 2, 3] },
    'Am': { frets: ['0', '1', '2', '2', '0', 'x'], fingers: [null, 1, 2, 3, null, null] },
    'Bdim': { frets: ['x', '2', '3', '1', 'x', 'x'], fingers: [null, 2, 3, 1, null, null] },
    'D': { frets: ['x', '3', '2', '0', 'x', 'x'], fingers: [null, 2, 1, null, null, null] },
    'E': { frets: ['0', '0', '1', '2', '2', '0'], fingers: [null, null, 1, 2, 3, null] },
    'A': { frets: ['0', '2', '2', '2', '0', 'x'], fingers: [null, 1, 2, 3, null, null] },
    'B': { frets: ['2', '4', '4', '4', '2', 'x'], fingers: [1, 2, 3, 4, 1, null] },
    'C#': { frets: ['x', '4', '6', '6', '6', '4'], fingers: [null, 1, 2, 3, 4, 1] },
    'D#': { frets: ['x', 'x', '1', '3', '4', 'x'], fingers: [null, null, 1, 2, 3, null] },
    'F#': { frets: ['2', '2', '3', '4', '4', '2'], fingers: [1, 1, 2, 4, 3, 1] },
    'G#': { frets: ['4', '4', '1', '1', '3', '4'], fingers: [3, 4, 1, 1, 2, 3] },
    'A#': { frets: ['1', '3', '3', '3', '1', 'x'], fingers: [1, 2, 3, 4, 1, null] },
    'G7': { frets: ['1', '3', '0', '0', '2', '3'], fingers: [1, 4, null, null, 2, 3] },
    'A7': { frets: ['0', '2', '0', '2', '0', 'x'], fingers: [null, 1, null, 2, null, null] },
    'B7': { frets: ['2', '0', '2', '1', '2', 'x'], fingers: [2, null, 3, 1, 4, null] },
    'C7': { frets: ['0', '1', '3', '2', '3', 'x'], fingers: [null, 1, 3, 2, 4, null] },
    'D7': { frets: ['x', '5', '4', '5', 'x', 'x'], fingers: [null, 2, 1, 3, null, null] },
    'E7': { frets: ['0', '0', '1', '0', '2', '0'], fingers: [null, null, 1, null, 2, null] }
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