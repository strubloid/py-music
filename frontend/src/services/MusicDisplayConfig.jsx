// Central configuration for music theory display settings
// This ensures consistent ordering across all components

class MusicDisplayConfig {
  constructor() {
    this.config = {
      // Default configuration - will be overridden by backend
      guitarStringOrder: ['E', 'B', 'G', 'D', 'A' , 'E'], // Low to High (6th to 1st string)
      pianoKeyOrder: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      blackKeyOrder: ['C#', 'D#', 'F#', 'G#', 'A#'],
      chordDisplayOrder: 'ascending', // or 'descending'
      noteNamingConvention: 'sharp', // or 'flat'
      fretboardDirection: 'leftToRight', // or 'rightToLeft'
      // Add more configuration as needed
    };
    this.loaded = false;
  }

  async loadConfig() {
    try {
      // Try to fetch configuration from backend
      const response = await fetch('/api/music-config');
      if (response.ok) {
        const backendConfig = await response.json();
        this.config = { ...this.config, ...backendConfig };
      }
    } catch (error) {
      console.warn('Failed to load music config from backend, using defaults:', error);
    } finally {
      this.loaded = true;
    }
    return this.config;
  }

  getConfig() {
    return this.config;
  }

  // Guitar string helpers
  getGuitarStrings() {
    return [...this.config.guitarStringOrder];
  }

  getGuitarStringIndex(stringName) {
    return this.config.guitarStringOrder.indexOf(stringName);
  }

  // Piano key helpers
  getPianoKeyOrder() {
    return [...this.config.pianoKeyOrder];
  }

  getBlackKeyOrder() {
    return [...this.config.blackKeyOrder];
  }

  // Chord display helpers
  shouldReverseChordOrder() {
    return this.config.chordDisplayOrder === 'descending';
  }

  // Note naming helpers
  prefersSharps() {
    return this.config.noteNamingConvention === 'sharp';
  }

  // Fretboard display helpers
  isLeftToRight() {
    return this.config.fretboardDirection === 'leftToRight';
  }
}

// Create singleton instance
const musicConfig = new MusicDisplayConfig();

// Export the instance and a hook-like function for React components
export default musicConfig;

export const useMusicConfig = () => {
  return musicConfig.getConfig();
};

// Initialize config when module loads
musicConfig.loadConfig();