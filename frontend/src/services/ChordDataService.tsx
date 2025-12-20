// Centralized chord data and rendering logic
// This ensures consistent chord display across all components
import { GUITAR_STRING_NAMES, PIANO_KEY_ORDER } from '../config/musicConfig';

export interface GuitarChordData {
  frets: string[];
  fingers: (number | null)[];
  position?: string; // Description like "Open", "Barre 3rd fret", etc.
}

export interface GuitarChordVariation {
  variations: GuitarChordData[];
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
  // Guitar chord fingerings - fingerings are in order: E(6th low), A(5th), D(4th), G(3rd), B(2nd), E(1st high)
  // Now with multiple variations per chord
  private guitarChordVariations: Record<string, GuitarChordData[]> = {
    // C Major - CAGED system (notes: C-E-G)
    'C': [
      { frets: ['x', '3', '2', '0', '1', '0'], fingers: [null, 3, 2, null, 1, null], position: 'C shape (open)' },
      { frets: ['x', '3', '5', '5', '5', '3'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (3rd fret)' },
      { frets: ['8', '7', '5', '5', '8', '8'], fingers: [3, 2, 1, 1, 4, 4], position: 'G shape (8th fret)' },
      { frets: ['8', '10', '10', '9', '8', '8'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (8th fret)' },
      { frets: ['x', 'x', '10', '12', '13', '12'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (10th fret)' }
    ],
    
    // C# Major
    'C#': [
      { frets: ['4', '6', '6', '6', '4', 'x'], fingers: [1, 2, 4, 3, 1, null], position: 'Barre 4th fret' },
      { frets: ['9', '6', '6', '6', 'x', 'x'], fingers: [4, 1, 1, 1, null, null], position: '6th position' },
      { frets: ['9', '11', '11', '10', '9', '9'], fingers: [1, 3, 4, 2, 1, 1], position: 'Barre 9th fret' },
      { frets: ['13', '14', '13', '11', 'x', 'x'], fingers: [2, 4, 3, 1, null, null], position: '11th position' }
    ],
    
    // D Major - CAGED system (notes: D-F#-A)
    'D': [
      { frets: ['x', 'x', '0', '2', '3', '2'], fingers: [null, null, null, 1, 3, 2], position: 'D shape (open)' },
      { frets: ['x', '5', '4', '2', '3', '2'], fingers: [null, 4, 3, 1, 2, 1], position: 'C shape (2nd fret)' },
      { frets: ['x', '5', '7', '7', '7', '5'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (5th fret)' },
      { frets: ['10', '9', '7', '7', '10', '10'], fingers: [3, 2, 1, 1, 4, 4], position: 'G shape (10th fret)' },
      { frets: ['10', '12', '12', '11', '10', '10'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (10th fret)' }
    ],
    
    // D# Major
    'D#': [
      { frets: ['3', '4', '3', '1', 'x', 'x'], fingers: [3, 4, 2, 1, null, null], position: '1st position' },
      { frets: ['6', '8', '8', '8', '6', 'x'], fingers: [1, 2, 4, 3, 1, null], position: 'Barre 6th fret' },
      { frets: ['11', '13', '13', '12', '11', '11'], fingers: [1, 3, 4, 2, 1, 1], position: 'Barre 11th fret' }
    ],
    
    // E Major - CAGED system (notes: E-G#-B)
    'E': [
      { frets: ['0', '2', '2', '1', '0', '0'], fingers: [null, 2, 3, 1, null, null], position: 'E shape (open)' },
      { frets: ['0', '2', '1', 'x', '0', '0'], fingers: [null, 3, 1, null, null, null], position: 'D shape (open)' },
      { frets: ['x', '7', '6', '4', '5', '4'], fingers: [null, 4, 3, 1, 2, 1], position: 'C shape (4th fret)' },
      { frets: ['x', '7', '9', '9', '9', '7'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (7th fret)' },
      { frets: ['12', '11', '9', '9', '12', '12'], fingers: [3, 2, 1, 1, 4, 4], position: 'G shape (12th fret)' }
    ],
    
    // F Major - CAGED system (notes: F-A-C)
    'F': [
      { frets: ['1', '3', '3', '2', '1', '1'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (1st fret)' },
      { frets: ['1', '0', 'x', 'x', '1', '1'], fingers: [2, 1, null, null, 3, 4], position: 'G shape (1st fret)' },
      { frets: ['x', 'x', '3', '5', '6', '5'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (3rd fret)' },
      { frets: ['x', '8', '7', '5', '6', '5'], fingers: [null, 4, 3, 1, 2, 1], position: 'C shape (5th fret)' },
      { frets: ['x', '8', '10', '10', '10', '8'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (8th fret)' }
    ],
    
    // F# Major
    'F#': [
      { frets: ['2', '4', '4', '3', '2', '2'], fingers: [1, 3, 4, 2, 1, 1], position: 'Barre 2nd fret' },
      { frets: ['6', '7', '6', '4', 'x', 'x'], fingers: [2, 4, 3, 1, null, null], position: '4th position' },
      { frets: ['9', '11', '11', '11', '9', 'x'], fingers: [1, 2, 4, 3, 1, null], position: 'Barre 9th fret' },
      { frets: ['14', '16', '16', '15', '14', '14'], fingers: [1, 3, 4, 2, 1, 1], position: 'Barre 14th fret' }
    ],
    
    // G Major - CAGED system (notes: G-B-D)
    'G': [
      { frets: ['3', '2', '0', '0', '0', '3'], fingers: [3, 2, null, null, null, 4], position: 'G shape (open)' },
      { frets: ['3', '2', '0', '0', '3', '3'], fingers: [2, 1, null, null, 3, 4], position: 'G shape alt' },
      { frets: ['3', '5', '5', '4', '3', '3'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (3rd fret)' },
      { frets: ['x', 'x', '5', '7', '8', '7'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (5th fret)' },
      { frets: ['x', '10', '12', '12', '12', '10'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (10th fret)' }
    ],
    
    // G# Major
    'G#': [
      { frets: ['4', '6', '6', '5', '4', '4'], fingers: [1, 3, 4, 2, 1, 1], position: 'Barre 4th fret' },
      { frets: ['8', '9', '8', '6', 'x', 'x'], fingers: [2, 4, 3, 1, null, null], position: '6th position' },
      { frets: ['4', '4', '5', '6', '6', '4'], fingers: [1, 1, 2, 3, 4, 1], position: 'Alt 4th position' },
      { frets: ['11', '13', '13', '13', '11', 'x'], fingers: [1, 2, 4, 3, 1, null], position: 'Barre 11th fret' }
    ],
    
    // A Major - CAGED system (notes: A-C#-E)
    'A': [
      { frets: ['x', '0', '2', '2', '2', '0'], fingers: [null, null, 2, 3, 4, null], position: 'A shape (open)' },
      { frets: ['5', '4', '2', '2', '5', '5'], fingers: [3, 2, 1, 1, 4, 4], position: 'G shape (5th fret)' },
      { frets: ['5', '7', '7', '6', '5', '5'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (5th fret)' },
      { frets: ['x', 'x', '7', '9', '10', '9'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (7th fret)' },
      { frets: ['x', '12', '11', '9', '10', '9'], fingers: [null, 4, 3, 1, 2, 1], position: 'C shape (9th fret)' }
    ],
    
    // A# Major
    'A#': [
      { frets: ['x', '1', '3', '3', '3', '1'], fingers: [null, 1, 2, 4, 3, 1], position: '1st position' },
      { frets: ['10', '11', '10', '8', 'x', 'x'], fingers: [2, 4, 3, 1, null, null], position: '8th position' },
      { frets: ['6', '6', '7', '8', '8', '6'], fingers: [1, 1, 2, 3, 4, 1], position: 'Barre 6th fret' },
      { frets: ['13', '15', '15', '15', '13', 'x'], fingers: [1, 2, 4, 3, 1, null], position: 'Barre 13th fret' }
    ],
    
    // B Major - CAGED system (notes: B-D#-F#)
    'B': [
      { frets: ['x', '2', '4', '4', '4', '2'], fingers: [null, 1, 3, 3, 3, 1], position: 'A shape (2nd fret)' },
      { frets: ['7', '6', '4', '4', '7', '7'], fingers: [3, 2, 1, 1, 4, 4], position: 'G shape (7th fret)' },
      { frets: ['7', '9', '9', '8', '7', '7'], fingers: [1, 3, 4, 2, 1, 1], position: 'E shape (7th fret)' },
      { frets: ['x', 'x', '9', '11', '12', '11'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (9th fret)' },
      { frets: ['x', '14', '13', '11', '12', '11'], fingers: [null, 4, 3, 1, 2, 1], position: 'C shape (11th fret)' }
    ],
    
    // Cm - C Minor (notes: C-Eb-G)
    'Cm': [
      { frets: ['x', '3', '5', '5', '4', '3'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (3rd fret)' },
      { frets: ['x', 'x', '5', '5', '4', '8'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (5th fret)' },
      { frets: ['8', '10', '10', '8', '8', '8'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (8th fret)' },
      { frets: ['x', 'x', '10', '12', '13', '11'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (10th fret)' },
      { frets: ['x', '3', '1', '0', '1', '3'], fingers: [null, 4, 1, null, 2, 3], position: 'C shape alt' }
    ],
    
    // Dm - D Minor (notes: D-F-A)
    'Dm': [
      { frets: ['x', 'x', '0', '2', '3', '1'], fingers: [null, null, null, 2, 3, 1], position: 'D shape (open)' },
      { frets: ['x', '5', '7', '7', '6', '5'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (5th fret)' },
      { frets: ['x', 'x', '7', '7', '6', '10'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (7th fret)' },
      { frets: ['10', '12', '12', '10', '10', '10'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (10th fret)' },
      { frets: ['x', 'x', '12', '14', '15', '13'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (12th fret)' }
    ],
    
    // Em - E Minor (notes: E-G-B)
    'Em': [
      { frets: ['0', '2', '2', '0', '0', '0'], fingers: [null, 2, 3, null, null, null], position: 'E shape (open)' },
      { frets: ['x', '7', '9', '9', '8', '7'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (7th fret)' },
      { frets: ['x', 'x', '9', '9', '8', '12'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (9th fret)' },
      { frets: ['12', '14', '14', '12', '12', '12'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (12th fret)' },
      { frets: ['x', 'x', '14', '16', '17', '15'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (14th fret)' }
    ],
    
    // Fm - F Minor (notes: F-Ab-C)
    'Fm': [
      { frets: ['1', '3', '3', '1', '1', '1'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (1st fret)' },
      { frets: ['x', '8', '10', '10', '9', '8'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (8th fret)' },
      { frets: ['x', 'x', '10', '10', '9', '13'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (10th fret)' },
      { frets: ['13', '15', '15', '13', '13', '13'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (13th fret)' },
      { frets: ['x', 'x', '3', '5', '6', '4'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (3rd fret)' }
    ],
    
    // Gm - G Minor (notes: G-Bb-D)
    'Gm': [
      { frets: ['3', '5', '5', '3', '3', '3'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (3rd fret)' },
      { frets: ['x', '10', '12', '12', '11', '10'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (10th fret)' },
      { frets: ['x', 'x', '12', '12', '11', '15'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (12th fret)' },
      { frets: ['15', '17', '17', '15', '15', '15'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (15th fret)' },
      { frets: ['x', 'x', '5', '7', '8', '6'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (5th fret)' }
    ],
    
    // Am - A Minor (notes: A-C-E)
    'Am': [
      { frets: ['x', '0', '2', '2', '1', '0'], fingers: [null, null, 2, 3, 1, null], position: 'A shape (open)' },
      { frets: ['5', '7', '7', '5', '5', '5'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (5th fret)' },
      { frets: ['x', '12', '14', '14', '13', '12'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (12th fret)' },
      { frets: ['x', 'x', '14', '14', '13', '17'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (14th fret)' },
      { frets: ['x', 'x', '7', '9', '10', '8'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (7th fret)' }
    ],
    
    // Bm - B Minor (notes: B-D-F#)
    'Bm': [
      { frets: ['x', '2', '4', '4', '3', '2'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (2nd fret)' },
      { frets: ['7', '9', '9', '7', '7', '7'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (7th fret)' },
      { frets: ['x', 'x', '9', '11', '12', '10'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (9th fret)' },
      { frets: ['x', '14', '16', '16', '15', '14'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (14th fret)' },
      { frets: ['x', 'x', '16', '16', '15', '19'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (16th fret)' }
    ],
    
    // Bdim - B Diminished (notes: B-D-F)
    'Bdim': [
      { frets: ['x', '2', '3', '4', '3', 'x'], fingers: [null, 1, 2, 4, 3, null], position: 'Open position' },
      { frets: ['x', 'x', '9', '10', '10', '9'], fingers: [null, null, 1, 3, 4, 2], position: '9th position' },
      { frets: ['7', '8', '9', '7', 'x', 'x'], fingers: [1, 2, 4, 3, null, null], position: '7th position' },
      { frets: ['x', '2', '0', '1', '0', 'x'], fingers: [null, 3, null, 2, null, null], position: 'Alt open' },
      { frets: ['x', 'x', '12', '13', '13', '12'], fingers: [null, null, 1, 3, 4, 2], position: '12th position' }
    ],
    
    // C#m - C# Minor (notes: C#-E-G#)
    'C#m': [
      { frets: ['x', '4', '6', '6', '5', '4'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (4th fret)' },
      { frets: ['x', 'x', '6', '6', '5', '9'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (6th fret)' },
      { frets: ['9', '11', '11', '9', '9', '9'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (9th fret)' },
      { frets: ['x', 'x', '11', '13', '14', '12'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (11th fret)' },
      { frets: ['x', '4', '2', '1', '2', '0'], fingers: [null, 4, 2, 1, 3, null], position: 'C shape alt' }
    ],
    
    // D#m - D# Minor (notes: D#-F#-A#)
    'D#m': [
      { frets: ['x', '6', '8', '8', '7', '6'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (6th fret)' },
      { frets: ['x', 'x', '8', '8', '7', '11'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (8th fret)' },
      { frets: ['11', '13', '13', '11', '11', '11'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (11th fret)' },
      { frets: ['x', 'x', '13', '15', '16', '14'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (13th fret)' },
      { frets: ['x', 'x', '1', '3', '4', '2'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (1st fret)' }
    ],
    
    // F#m - F# Minor (notes: F#-A-C#)
    'F#m': [
      { frets: ['2', '4', '4', '2', '2', '2'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (2nd fret)' },
      { frets: ['x', '9', '11', '11', '10', '9'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (9th fret)' },
      { frets: ['x', 'x', '11', '11', '10', '14'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (11th fret)' },
      { frets: ['14', '16', '16', '14', '14', '14'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (14th fret)' },
      { frets: ['x', 'x', '4', '6', '7', '5'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (4th fret)' }
    ],
    
    // G#m - G# Minor (notes: G#-B-D#)
    'G#m': [
      { frets: ['4', '6', '6', '4', '4', '4'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (4th fret)' },
      { frets: ['x', '11', '13', '13', '12', '11'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (11th fret)' },
      { frets: ['x', 'x', '13', '13', '12', '16'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (13th fret)' },
      { frets: ['16', '18', '18', '16', '16', '16'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (16th fret)' },
      { frets: ['x', 'x', '6', '8', '9', '7'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (6th fret)' }
    ],
    
    // A#m - A# Minor (notes: A#-C#-F)
    'A#m': [
      { frets: ['x', '1', '3', '3', '2', '1'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (1st fret)' },
      { frets: ['6', '8', '8', '6', '6', '6'], fingers: [1, 3, 4, 1, 1, 1], position: 'E shape (6th fret)' },
      { frets: ['x', 'x', '8', '10', '11', '9'], fingers: [null, null, 1, 3, 4, 2], position: 'D shape (8th fret)' },
      { frets: ['x', '13', '15', '15', '14', '13'], fingers: [null, 1, 3, 4, 2, 1], position: 'A shape (13th fret)' },
      { frets: ['x', 'x', '15', '15', '14', '18'], fingers: [null, null, 2, 3, 1, 4], position: 'G shape (15th fret)' }
    ]
  };
  
  // Keep legacy single-variation format for backwards compatibility
  private guitarChords: Record<string, GuitarChordData> = {
    // Major Chords
    'C': { frets: ['x', '3', '2', '0', '1', '0'], fingers: [null, 3, 2, null, 1, null] },
    'C#': { frets: ['4', '6', '6', '6', '4', 'x'], fingers: [1, 2, 4, 3, 1, null] },
    'D': { frets: ['x', 'x', '0', '2', '3', '2'], fingers: [null, null, null, 2, 3, 1] },
    'D#': { frets: ['3', '4', '3', '1', 'x', 'x'], fingers: [3, 4, 2, 1, null, null] },
    'E': { frets: ['0', '2', '2', '1', '0', '0'], fingers: [null, 2, 3, 1, null, null] },
    'F': { frets: ['1', '3', '3', '2', '1', '1'], fingers: [1, 3, 4, 2, 1, 1] },
    'F#': { frets: ['2', '4', '4', '3', '2', '2'], fingers: [1, 3, 4, 2, 1, 1] },
    'G': { frets: ['3', '2', '0', '0', '0', '3'], fingers: [4, 2, null, null, null, 3] },
    'G#': { frets: ['4', '6', '6', '5', '4', '4'], fingers: [1, 3, 4, 2, 1, 1] },
    'A': { frets: ['x', '0', '2', '2', '2', '0'], fingers: [null, null, 4, 3, 2, null] },
    'A#': { frets: ['x', '1', '3', '3', '3', '1'], fingers: [null, 1, 2, 4, 3, 1] },
    'B': { frets: ['x', '2', '4', '4', '4', '2'], fingers: [null, 1, 2, 4, 3, 1] },
    
    // Minor Chords
    'Cm': { frets: ['3', '4', '5', '5', '3', 'x'], fingers: [1, 2, 4, 3, 1, null] },
    'C#m': { frets: ['4', '5', '6', '6', '4', 'x'], fingers: [1, 2, 4, 3, 1, null] },
    'Dm': { frets: ['x', 'x', '0', '2', '3', '1'], fingers: [null, null, null, 2, 3, 1] },
    'D#m': { frets: ['2', '4', '3', '1', 'x', 'x'], fingers: [2, 4, 3, 1, null, null] },
    'Em': { frets: ['0', '2', '2', '0', '0', '0'], fingers: [null, 3, 2, null, null, null] },
    'Fm': { frets: ['1', '4', '3', '1', '1', '1'], fingers: [1, 4, 3, 1, 1, 1] },
    'F#m': { frets: ['2', '5', '4', '2', '2', '2'], fingers: [1, 4, 3, 1, 1, 1] },
    'Gm': { frets: ['3', '6', '5', '3', '3', '3'], fingers: [1, 4, 3, 1, 1, 1] },
    'G#m': { frets: ['4', '7', '6', '4', '4', '4'], fingers: [1, 4, 3, 1, 1, 1] },
    'Am': { frets: ['x', '0', '2', '2', '1', '0'], fingers: [null, null, 2, 3, 1, null] },
    'A#m': { frets: ['x', '1', '3', '3', '2', '1'], fingers: [null, 1, 3, 4, 2, 1] },
    'Bm': { frets: ['x', '2', '4', '4', '3', '2'], fingers: [null, 1, 3, 4, 2, 1] },
    
    // Dominant 7th Chords
    'C7': { frets: ['x', '3', '2', '3', '1', '0'], fingers: [null, 3, 2, 4, 1, null] },
    'C#7': { frets: ['x', '2', '4', '3', '4', 'x'], fingers: [null, 1, 4, 2, 3, null] },
    'D7': { frets: ['x', 'x', '0', '2', '1', '2'], fingers: [null, null, null, 3, 1, 2] },
    'D#7': { frets: ['3', '2', '0', '1', 'x', 'x'], fingers: [4, 2, null, 1, null, null] },
    'E7': { frets: ['0', '2', '0', '1', '0', '0'], fingers: [null, 2, null, 1, null, null] },
    'F7': { frets: ['1', '3', '1', '2', '1', '1'], fingers: [1, 3, 1, 2, 1, 1] },
    'F#7': { frets: ['2', '4', '2', '3', '2', '2'], fingers: [1, 3, 1, 2, 1, 1] },
    'G7': { frets: ['3', '2', '0', '0', '0', '1'], fingers: [3, 2, null, null, null, 1] },
    'G#7': { frets: ['4', '6', '4', '5', '4', '4'], fingers: [1, 3, 1, 2, 1, 1] },
    'A7': { frets: ['x', '0', '2', '0', '2', '0'], fingers: [null, null, 3, null, 2, null] },
    'A#7': { frets: ['x', '1', '3', '1', '3', '1'], fingers: [null, 1, 4, 1, 3, 1] },
    'B7': { frets: ['x', '2', '1', '2', '0', '2'], fingers: [null, 4, 1, 3, null, 2] },
    
    // Major 7th Chords
    'Cmaj7': { frets: ['x', '3', '2', '0', '0', '0'], fingers: [null, 3, 2, null, null, null] },
    'C#maj7': { frets: ['x', '6', '5', '3', '4', 'x'], fingers: [null, 4, 3, 1, 2, null] },
    'Dmaj7': { frets: ['x', 'x', '0', '2', '2', '2'], fingers: [null, null, null, 1, 3, 2] },
    'D#maj7': { frets: ['3', '3', '0', '1', 'x', 'x'], fingers: [4, 3, null, 1, null, null] },
    'Emaj7': { frets: ['0', '2', '1', '1', '0', '0'], fingers: [null, 3, 2, 1, null, null] },
    'Fmaj7': { frets: ['x', 'x', '3', '2', '1', '0'], fingers: [null, null, 3, 2, 1, null] },
    'F#maj7': { frets: ['x', 'x', '3', '3', '1', '2'], fingers: [null, null, 4, 3, 1, 2] },
    'Gmaj7': { frets: ['3', '2', '0', '0', '0', '2'], fingers: [4, 3, null, null, null, 2] },
    'G#maj7': { frets: ['x', 'x', '5', '5', '3', '4'], fingers: [null, null, 4, 3, 1, 2] },
    'Amaj7': { frets: ['x', '0', '2', '1', '2', '0'], fingers: [null, null, 2, 1, 3, null] },
    'A#maj7': { frets: ['x', '1', '3', '2', '3', '1'], fingers: [null, 1, 3, 2, 4, 1] },
    'Bmaj7': { frets: ['x', '2', '4', '3', '4', '2'], fingers: [null, 1, 3, 2, 4, 1] },
    
    // Minor 7th Chords
    'Cm7': { frets: ['3', '4', '3', '1', '3', 'x'], fingers: [2, 4, 3, 1, 2, null] },
    'C#m7': { frets: ['4', '5', '4', '2', '4', 'x'], fingers: [2, 4, 3, 1, 2, null] },
    'Dm7': { frets: ['5', '6', '5', '3', '5', 'x'], fingers: [2, 4, 3, 1, 2, null] },
    'D#m7': { frets: ['2', '2', '3', '1', 'x', 'x'], fingers: [3, 2, 4, 1, null, null] },
    'Em7': { frets: ['0', '2', '0', '0', '0', '0'], fingers: [null, 2, null, null, null, null] },
    'Fm7': { frets: ['1', '3', '1', '1', '1', '1'], fingers: [1, 3, 1, 1, 1, 1] },
    'F#m7': { frets: ['2', '4', '2', '2', '2', '2'], fingers: [1, 3, 1, 1, 1, 1] },
    'Gm7': { frets: ['3', '5', '3', '3', '3', '3'], fingers: [1, 3, 1, 1, 1, 1] },
    'G#m7': { frets: ['4', '6', '4', '4', '4', '4'], fingers: [1, 3, 1, 1, 1, 1] },
    'Am7': { frets: ['x', '0', '2', '0', '1', '0'], fingers: [null, null, 2, null, 1, null] },
    'A#m7': { frets: ['x', '1', '3', '1', '2', '1'], fingers: [null, 1, 3, 1, 2, 1] },
    'Bm7': { frets: ['x', '2', '4', '2', '3', '2'], fingers: [null, 1, 3, 1, 2, 1] },
    
    // Diminished Chords
    'Cdim': { frets: ['x', 'x', '2', '4', '3', 'x'], fingers: [null, null, 1, 3, 2, null] },
    'C#dim': { frets: ['x', 'x', '3', '5', '4', 'x'], fingers: [null, null, 1, 3, 2, null] },
    'Ddim': { frets: ['1', '0', '1', '0', 'x', 'x'], fingers: [2, null, 1, null, null, null] },
    'D#dim': { frets: ['2', '1', '2', '1', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'Edim': { frets: ['3', '2', '3', '2', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'Fdim': { frets: ['4', '3', '4', '3', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'F#dim': { frets: ['5', '4', '5', '4', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'Gdim': { frets: ['6', '5', '6', '5', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'G#dim': { frets: ['7', '6', '7', '6', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'Adim': { frets: ['x', '1', '2', '1', '0', 'x'], fingers: [null, 2, 3, 1, null, null] },
    'A#dim': { frets: ['x', '2', '3', '2', '1', 'x'], fingers: [null, 3, 4, 2, 1, null] },
    'Bdim': { frets: ['x', '3', '4', '3', '2', 'x'], fingers: [null, 3, 4, 2, 1, null] },
    
    // Augmented Chords
    'Caug': { frets: ['0', '1', '1', '2', '3', 'x'], fingers: [null, 1, 2, 3, 4, null] },
    'C#aug': { frets: ['1', '2', '2', '3', '4', 'x'], fingers: [1, 2, 2, 3, 4, null] },
    'Daug': { frets: ['2', '3', '3', '0', 'x', 'x'], fingers: [2, 4, 3, null, null, null] },
    'D#aug': { frets: ['3', '4', '4', '1', 'x', 'x'], fingers: [2, 4, 3, 1, null, null] },
    'Eaug': { frets: ['0', '1', '1', '2', '3', '0'], fingers: [null, 1, 2, 3, 4, null] },
    'Faug': { frets: ['1', '2', '2', '3', 'x', 'x'], fingers: [1, 3, 2, 4, null, null] },
    'F#aug': { frets: ['2', '3', '3', '4', 'x', 'x'], fingers: [1, 3, 2, 4, null, null] },
    'Gaug': { frets: ['3', '0', '0', '1', '2', '3'], fingers: [4, null, null, 2, 3, 4] },
    'G#aug': { frets: ['4', '1', '1', '2', '3', '4'], fingers: [4, 1, 1, 2, 3, 4] },
    'Aaug': { frets: ['1', '2', '2', '3', '0', 'x'], fingers: [1, 3, 2, 4, null, null] },
    'A#aug': { frets: ['2', '3', '3', '4', '1', 'x'], fingers: [2, 3, 2, 4, 1, null] },
    'Baug': { frets: ['3', '4', '4', '5', '2', 'x'], fingers: [2, 3, 2, 4, 1, null] },
    
    // Suspended 2nd Chords
    'Csus2': { frets: ['3', '1', '0', '0', '3', 'x'], fingers: [4, 1, null, null, 3, null] },
    'C#sus2': { frets: ['4', '2', '1', '1', '4', 'x'], fingers: [4, 2, 1, 1, 3, null] },
    'Dsus2': { frets: ['5', '3', '2', '2', '5', 'x'], fingers: [4, 2, 1, 1, 3, null] },
    'D#sus2': { frets: ['1', '4', '3', '1', 'x', 'x'], fingers: [1, 4, 3, 1, null, null] },
    'Esus2': { frets: ['0', '0', '4', '4', '2', '0'], fingers: [null, null, 4, 3, 1, null] },
    'Fsus2': { frets: ['1', '1', '0', '3', 'x', 'x'], fingers: [2, 1, null, 3, null, null] },
    'F#sus2': { frets: ['2', '2', '1', '4', 'x', 'x'], fingers: [3, 2, 1, 4, null, null] },
    'Gsus2': { frets: ['3', '3', '2', '0', '0', '3'], fingers: [4, 3, 1, null, null, 2] },
    'G#sus2': { frets: ['4', '4', '3', '6', 'x', 'x'], fingers: [3, 2, 1, 4, null, null] },
    'Asus2': { frets: ['0', '0', '2', '2', '0', '0'], fingers: [null, null, 3, 2, null, null] },
    'A#sus2': { frets: ['1', '1', '3', '3', '1', 'x'], fingers: [1, 1, 4, 3, 1, null] },
    'Bsus2': { frets: ['2', '2', '4', '4', '2', 'x'], fingers: [1, 1, 4, 3, 1, null] },
    
    // Suspended 4th Chords
    'Csus4': { frets: ['1', '1', '0', '3', '3', 'x'], fingers: [2, 1, null, 4, 3, null] },
    'C#sus4': { frets: ['2', '2', '1', '4', '4', 'x'], fingers: [2, 1, 1, 4, 3, null] },
    'Dsus4': { frets: ['3', '3', '2', '5', '5', 'x'], fingers: [2, 1, 1, 4, 3, null] },
    'D#sus4': { frets: ['4', '4', '3', '1', 'x', 'x'], fingers: [4, 3, 2, 1, null, null] },
    'Esus4': { frets: ['0', '0', '2', '2', '0', '0'], fingers: [null, null, 3, 2, null, null] },
    'Fsus4': { frets: ['1', '1', '3', '3', 'x', 'x'], fingers: [2, 1, 4, 3, null, null] },
    'F#sus4': { frets: ['2', '2', '4', '4', 'x', 'x'], fingers: [2, 1, 4, 3, null, null] },
    'Gsus4': { frets: ['3', '1', '0', '0', '3', '3'], fingers: [3, 1, null, null, 4, 3] },
    'G#sus4': { frets: ['4', '4', '6', '6', '4', '4'], fingers: [1, 1, 4, 3, 1, 1] },
    'Asus4': { frets: ['0', '3', '2', '2', '0', '0'], fingers: [null, 4, 3, 2, null, null] },
    'A#sus4': { frets: ['1', '4', '3', '3', '1', 'x'], fingers: [1, 4, 3, 3, 1, null] },
    'Bsus4': { frets: ['2', '5', '4', '4', '2', 'x'], fingers: [1, 4, 3, 3, 1, null] },
    
    // Add9 Chords
    'Cadd9': { frets: ['0', '3', '0', '2', '3', 'x'], fingers: [null, 4, null, 2, 3, null] },
    'Dadd9': { frets: ['0', '3', '2', '4', '5', 'x'], fingers: [null, 2, 1, 3, 4, null] },
    'Eadd9': { frets: ['0', '0', '1', '4', '2', '0'], fingers: [null, null, 1, 4, 2, null] },
    'Fadd9': { frets: ['3', '1', '2', '3', 'x', 'x'], fingers: [4, 1, 3, 4, null, null] },
    'Gadd9': { frets: ['3', '0', '2', '0', '0', '3'], fingers: [4, null, 2, null, null, 3] },
    'Aadd9': { frets: ['0', '2', '4', '2', '0', 'x'], fingers: [null, 2, 4, 1, null, null] },
    'Badd9': { frets: ['2', '2', '4', '1', '2', 'x'], fingers: [3, 2, 4, 1, 2, null] },
    
    // Power Chords (5)
    'C5': { frets: ['x', '1', '0', 'x', '3', 'x'], fingers: [null, 1, null, null, 3, null] },
    'D5': { frets: ['x', '3', '2', 'x', '5', 'x'], fingers: [null, 2, 1, null, 3, null] },
    'E5': { frets: ['0', '0', 'x', 'x', '2', '0'], fingers: [null, null, null, null, 2, null] },
    'F5': { frets: ['1', '1', 'x', 'x', '3', '1'], fingers: [1, 1, null, null, 3, 1] },
    'G5': { frets: ['3', '3', 'x', 'x', '5', '3'], fingers: [1, 1, null, null, 3, 1] },
    'A5': { frets: ['x', '0', 'x', 'x', '2', '0'], fingers: [null, null, null, null, 2, null] },
    'B5': { frets: ['x', '4', 'x', 'x', '2', 'x'], fingers: [null, 3, null, null, 1, null] },
    
    // Minor Major 7th Chords (mM7)
    'CmM7': { frets: ['x', '4', '0', '1', '3', 'x'], fingers: [null, 4, null, 1, 3, null] },
    'DmM7': { frets: ['x', '6', '2', '3', '5', 'x'], fingers: [null, 4, 1, 2, 3, null] },
    'EmM7': { frets: ['0', '0', '0', '1', '2', '0'], fingers: [null, null, null, 1, 3, null] },
    'FmM7': { frets: ['1', '1', '1', '2', '3', '1'], fingers: [1, 1, 1, 2, 4, 1] },
    'GmM7': { frets: ['3', '3', '3', '4', '5', '3'], fingers: [1, 1, 1, 2, 4, 1] },
    'AmM7': { frets: ['0', '1', '1', '2', '0', 'x'], fingers: [null, 3, 2, 4, null, null] },
    'BmM7': { frets: ['2', '3', '3', '4', '2', 'x'], fingers: [1, 3, 2, 4, 1, null] },
    
    // 6th Chords
    'C6': { frets: ['0', '1', '2', '2', '3', 'x'], fingers: [null, 1, 2, 3, 4, null] },
    'D6': { frets: ['0', '3', '4', '4', '5', 'x'], fingers: [null, 2, 3, 3, 4, null] },
    'E6': { frets: ['0', '2', '1', '2', '2', '0'], fingers: [null, 4, 1, 3, 2, null] },
    'F6': { frets: ['5', '3', '5', '3', 'x', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'G6': { frets: ['0', '0', '0', '0', '2', '3'], fingers: [null, null, null, null, 2, 3] },
    'A6': { frets: ['2', '2', '2', '2', '0', 'x'], fingers: [4, 3, 2, 1, null, null] },
    'B6': { frets: ['2', '1', '1', '1', '2', 'x'], fingers: [4, 1, 1, 1, 3, null] },
    
    // 9th Chords
    'C9': { frets: ['3', '3', '3', '2', '3', 'x'], fingers: [4, 3, 3, 1, 2, null] },
    'D9': { frets: ['5', '5', '5', '4', '5', 'x'], fingers: [4, 3, 3, 1, 2, null] },
    'E9': { frets: ['2', '0', '1', '0', '2', '0'], fingers: [3, null, 1, null, 2, null] },
    'F9': { frets: ['3', '1', '2', '1', '3', '1'], fingers: [4, 1, 2, 1, 3, 1] },
    'G9': { frets: ['1', '0', '2', '0', '2', '3'], fingers: [1, null, 3, null, 2, 4] },
    'A9': { frets: ['3', '2', '4', '2', '0', 'x'], fingers: [4, 2, 3, 1, null, null] },
    'B9': { frets: ['2', '2', '2', '1', '2', 'x'], fingers: [4, 3, 3, 1, 2, null] }
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

  // String names for guitar (standard tuning) - imported from central config
  public readonly guitarStringNames: string[] = [...GUITAR_STRING_NAMES];
  
  // Piano key order (one octave) - imported from central config
  public readonly pianoKeyOrder: string[] = [...PIANO_KEY_ORDER];

  // Get chord data for guitar
  getGuitarChordData(chordName: string): GuitarChordData {
    return this.guitarChords[chordName] || this.guitarChords['C'];
  }

  // Get all variations for a guitar chord
  getGuitarChordVariations(chordName: string): GuitarChordData[] {
    // If we have multiple variations, return them
    if (this.guitarChordVariations[chordName]) {
      return this.guitarChordVariations[chordName];
    }
    
    // Otherwise return single variation as array for consistency
    const singleChord = this.guitarChords[chordName];
    if (singleChord) {
      return [singleChord];
    }
    
    // Fallback to C major
    return this.guitarChordVariations['C'] || [this.guitarChords['C']];
  }

  // Get specific variation by index
  getGuitarChordVariation(chordName: string, variationIndex: number = 0): GuitarChordData {
    const variations = this.getGuitarChordVariations(chordName);
    const index = Math.max(0, Math.min(variationIndex, variations.length - 1));
    return variations[index];
  }

  // Check if a chord has multiple variations
  hasMultipleVariations(chordName: string): boolean {
    return this.guitarChordVariations[chordName]?.length > 1 || false;
  }

  // Get count of variations for a chord
  getVariationCount(chordName: string): number {
    return this.getGuitarChordVariations(chordName).length;
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