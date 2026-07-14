// Central configuration for music theory display settings
// This ensures consistent ordering across all components

interface MusicConfig {
  guitarStringOrder: string[];
  pianoKeyOrder: string[];
  blackKeyOrder: string[];
  chordDisplayOrder: 'ascending' | 'descending';
  noteNamingConvention: 'sharp' | 'flat';
  fretboardDirection: 'leftToRight' | 'rightToLeft';
}

interface BackendMusicConfig extends Partial<MusicConfig> {
  // Allow backend to override any config properties
  [key: string]: unknown;
}

class MusicDisplayConfig {
  private config: MusicConfig;
  public loaded: boolean;

  constructor() {
    this.config = {
      // Default configuration - will be overridden by backend
      guitarStringOrder: ['E', 'B', 'G', 'D', 'A', 'E'], // Low to High (6th to 1st string)
      pianoKeyOrder: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      blackKeyOrder: ['C#', 'D#', 'F#', 'G#', 'A#'],
      chordDisplayOrder: 'ascending', // or 'descending'
      noteNamingConvention: 'sharp', // or 'flat'
      fretboardDirection: 'leftToRight', // or 'rightToLeft'
      // Add more configuration as needed
    };
    this.loaded = false;
  }

  async loadConfig(): Promise<MusicConfig> {
    try {
      // Try to fetch configuration from backend
      const response = await fetch('/api/music-config');
      if (response.ok) {
        const backendConfig: BackendMusicConfig = await response.json();
        this.config = { ...this.config, ...backendConfig };
      }
    } catch (error) {
      console.warn('Failed to load music config from backend, using defaults:', error);
    } finally {
      this.loaded = true;
    }
    return this.config;
  }

  getConfig(): MusicConfig {
    return this.config;
  }

  // Guitar string helpers
  getGuitarStrings(): string[] {
    return [...this.config.guitarStringOrder];
  }

  getGuitarStringIndex(stringName: string): number {
    return this.config.guitarStringOrder.indexOf(stringName);
  }

  // Piano key helpers
  getPianoKeyOrder(): string[] {
    return [...this.config.pianoKeyOrder];
  }

  getBlackKeyOrder(): string[] {
    return [...this.config.blackKeyOrder];
  }

  // Chord display helpers
  shouldReverseChordOrder(): boolean {
    return this.config.chordDisplayOrder === 'descending';
  }

  // Note naming helpers
  prefersSharps(): boolean {
    return this.config.noteNamingConvention === 'sharp';
  }

  // Fretboard display helpers
  isLeftToRight(): boolean {
    return this.config.fretboardDirection === 'leftToRight';
  }
}

// Create singleton instance
const musicConfig = new MusicDisplayConfig();

// Export the instance and a hook-like function for React components
export default musicConfig;

export const useMusicConfig = (): MusicConfig => {
  return musicConfig.getConfig();
};

// Initialize config when module loads
musicConfig.loadConfig();