import React, { createContext, useContext, useState, useCallback } from 'react';

const ChordPanelContext = createContext();

export const useChordPanel = () => {
  const context = useContext(ChordPanelContext);
  if (!context) {
    throw new Error('useChordPanel must be used within ChordPanelProvider');
  }
  return context;
};

export const ChordPanelProvider = ({ children }) => {
  // ─── Basic Progression State ─────────────────────────────────────────────
  const [progressionLines, setProgressionLines] = useState([[]]);
  const [currentLine, setCurrentLine] = useState(0);
  const [showChords, setShowChords] = useState(false);

  // ─── Lyrics State ───────────────────────────────────────────────────────
  // lyrics[lineIndex] = "word1 word2 word3"
  const [lyrics, setLyrics] = useState({});

  // ─── Chord-Lyrics Positioning ──────────────────────────────────────────
  // chordOverLyrics[lineIndex] = [{ chord: "G", wordIndex: 0 }, { chord: "C", wordIndex: 2 }]
  // wordIndex refers to the position INSIDE the lyric line (split by space)
  const [chordOverLyrics, setChordOverLyrics] = useState({});

  // ─── View Mode ──────────────────────────────────────────────────────────
  // "builder" = classic chord buttons + lines
  // "lyrics" = lyrics with chords positioned above
  const [viewMode, setViewMode] = useState('builder');

  // ─── Basic Progression Methods ───────────────────────────────────────────
  const addChordToProgression = useCallback((chord) => {
    setProgressionLines(prev => {
      const newLines = [...prev];
      newLines[currentLine] = [...newLines[currentLine], chord];
      return newLines;
    });
  }, [currentLine]);

  const removeChordFromProgression = useCallback((lineIndex, chordIndex) => {
    setProgressionLines(prev => {
      const newLines = [...prev];
      newLines[lineIndex] = newLines[lineIndex].filter((_, index) => index !== chordIndex);
      return newLines;
    });
  }, []);

  const addProgressionLine = useCallback(() => {
    setProgressionLines(prev => {
      const newLineIndex = prev.length;
      setCurrentLine(newLineIndex);
      return [...prev, []];
    });
  }, []);

  const removeProgressionLine = useCallback((lineIndex) => {
    if (progressionLines.length > 1) {
      setProgressionLines(prev => prev.filter((_, index) => index !== lineIndex));
      if (currentLine >= progressionLines.length - 1) {
        setCurrentLine(Math.max(0, progressionLines.length - 2));
      }
    }
  }, [progressionLines.length, currentLine]);

  const clearProgression = useCallback(() => {
    setProgressionLines([[]]);
    setCurrentLine(0);
    setLyrics({});
    setChordOverLyrics({});
  }, []);

  const setCurrentProgressionLine = useCallback((lineIndex) => {
    setCurrentLine(lineIndex);
  }, []);

  const toggleChords = useCallback(() => {
    setShowChords(prev => !prev);
  }, []);

  // ─── Lyrics Methods ─────────────────────────────────────────────────────
  const setLyricLine = useCallback((lineIndex, text) => {
    setLyrics(prev => ({ ...prev, [lineIndex]: text }));
  }, []);

  // Sync lyrics when progression lines change (add/remove lines)
  const syncLyricsToLines = useCallback(() => {
    // This is called externally when lines are added/removed
  }, []);

  // ─── Chord-Lyrics Positioning Methods ──────────────────────────────────
  
  // Place a chord at a specific word position in a lyric line
  const placeChordAtWord = useCallback((lineIndex, wordIndex, chord) => {
    setChordOverLyrics(prev => {
      const lineChords = prev[lineIndex] || [];
      // Remove any existing chord at this word position
      const filtered = lineChords.filter(c => c.wordIndex !== wordIndex);
      // Add the new chord
      if (chord) {
        filtered.push({ chord, wordIndex });
      }
      // Sort by wordIndex
      filtered.sort((a, b) => a.wordIndex - b.wordIndex);
      return { ...prev, [lineIndex]: filtered };
    });
  }, []);

  // Remove chord from a word position
  const removeChordFromWord = useCallback((lineIndex, wordIndex) => {
    setChordOverLyrics(prev => {
      const lineChords = prev[lineIndex] || [];
      const filtered = lineChords.filter(c => c.wordIndex !== wordIndex);
      return { ...prev, [lineIndex]: filtered };
    });
  }, []);

  // Get chord at a specific word position
  const getChordAtWord = useCallback((lineIndex, wordIndex) => {
    const lineChords = chordOverLyrics[lineIndex] || [];
    const found = lineChords.find(c => c.wordIndex === wordIndex);
    return found ? found.chord : null;
  }, [chordOverLyrics]);

  // Clear all chord-lyrics associations for a line
  const clearLineChords = useCallback((lineIndex) => {
    setChordOverLyrics(prev => {
      const newState = { ...prev };
      delete newState[lineIndex];
      return newState;
    });
  }, []);

  // Add empty lyric line when new progression line is added
  React.useEffect(() => {
    setLyrics(prev => {
      const updated = {};
      progressionLines.forEach((_, i) => {
        updated[i] = prev[i] ?? '';
      });
      return updated;
    });
    setChordOverLyrics(prev => {
      const updated = {};
      progressionLines.forEach((_, i) => {
        updated[i] = prev[i] ?? [];
      });
      return updated;
    });
  }, [progressionLines.length]);

  return (
    <ChordPanelContext.Provider value={{
      // Basic progression state
      progressionLines,
      currentLine,
      addChordToProgression,
      removeChordFromProgression,
      addProgressionLine,
      removeProgressionLine,
      clearProgression,
      setCurrentProgressionLine,
      showChords,
      toggleChords,
      // Lyrics state
      lyrics,
      setLyricLine,
      // Chord-lyrics positioning
      chordOverLyrics,
      placeChordAtWord,
      removeChordFromWord,
      getChordAtWord,
      clearLineChords,
      // View mode
      viewMode,
      setViewMode,
    }}>
      {children}
    </ChordPanelContext.Provider>
  );
};
