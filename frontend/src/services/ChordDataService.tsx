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

  // Piano chord definitions
  private pianoChords: Record<string, string[]> = {
    'C': ['C', 'E', 'G'],
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
    'F': ['F', 'A', 'C'],
    'G': ['G', 'B', 'D'],
    'Am': ['A', 'C', 'E'],
    'Bdim': ['B', 'D', 'F'],
    'D': ['D', 'F#', 'A'],
    'E': ['E', 'G#', 'B'],
    'A': ['A', 'C#', 'E'],
    'B': ['B', 'D#', 'F#'],
    'C#': ['C#', 'F', 'G#'],
    'D#': ['D#', 'G', 'A#'],
    'F#': ['F#', 'A#', 'C#'],
    'G#': ['G#', 'C', 'D#'],
    'A#': ['A#', 'D', 'F'],
    'C7': ['C', 'E', 'G', 'A#'],
    'G7': ['G', 'B', 'D', 'F'],
    'A7': ['A', 'C#', 'E', 'G'],
    'B7': ['B', 'D#', 'F#', 'A'],
    'D7': ['D', 'F#', 'A', 'C'],
    'E7': ['E', 'G#', 'B', 'D']
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