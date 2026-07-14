// Manages user preferences for chord variations
// Stores selected variations in localStorage

const STORAGE_KEY = 'chord_variation_preferences';

interface ChordPreferences {
  [chordName: string]: number; // chordName -> variation index
}

class ChordPreferenceManager {
  private preferences: ChordPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  // Load preferences from localStorage
  private loadPreferences(): ChordPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading chord preferences:', error);
      return {};
    }
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving chord preferences:', error);
    }
  }

  // Get preferred variation index for a chord (default to 0)
  getPreferredVariation(chordName: string): number {
    return this.preferences[chordName] ?? 0;
  }

  // Set preferred variation for a chord
  setPreferredVariation(chordName: string, variationIndex: number): void {
    this.preferences[chordName] = variationIndex;
    this.savePreferences();
  }

  // Clear all preferences
  clearAllPreferences(): void {
    this.preferences = {};
    this.savePreferences();
  }

  // Clear preference for specific chord
  clearChordPreference(chordName: string): void {
    delete this.preferences[chordName];
    this.savePreferences();
  }

  // Get all preferences
  getAllPreferences(): ChordPreferences {
    return { ...this.preferences };
  }
}

// Create and export singleton instance
const chordPreferenceManager = new ChordPreferenceManager();
export default chordPreferenceManager;
