/**
 * Music Configuration Constants
 * Central configuration file for music-related constants used across the frontend.
 */

// Guitar Configuration
export const MAX_FRETS: number = 24;  // Maximum number of frets on the guitar fretboard
export const DEFAULT_FRET_COUNT: number = 13;  // Default number of frets to display initially
export const MIN_FRET_COUNT: number = 5;  // Minimum number of frets that can be displayed
export const PRESET_FRET_COUNTS: readonly number[] = [12, 15, 19, 24] as const;  // Preset fret count options
