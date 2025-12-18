import React, { createContext, useContext, useState } from 'react';

const ChordPanelContext = createContext();

export const useChordPanel = () => {
  const context = useContext(ChordPanelContext);
  if (!context) {
    throw new Error('useChordPanel must be used within ChordPanelProvider');
  }
  return context;
};

export const ChordPanelProvider = ({ children }) => {
  const [selectedChords, setSelectedChords] = useState([]);
  const [highlightedChord, setHighlightedChord] = useState(null);
  
  // Progression state - persists across tab switches
  const [progressionLines, setProgressionLines] = useState([[]]);
  const [currentLine, setCurrentLine] = useState(0);

  const addChord = (chord) => {
    // Add chord to the array (allows duplicates for building progressions)
    setSelectedChords(prev => [...prev, chord]);
  };

  const removeChord = (index) => {
    setSelectedChords(prev => prev.filter((_, i) => i !== index));
  };

  const clearChords = () => {
    setSelectedChords([]);
    setHighlightedChord(null);
  };

  const isHighlighted = (chordName) => {
    return highlightedChord === chordName;
  };

  // Progression methods
  const addChordToProgression = (chord) => {
    setProgressionLines(prev => {
      const newLines = [...prev];
      newLines[currentLine] = [...newLines[currentLine], chord];
      return newLines;
    });
  };

  const removeChordFromProgression = (lineIndex, chordIndex) => {
    setProgressionLines(prev => {
      const newLines = [...prev];
      newLines[lineIndex] = newLines[lineIndex].filter((_, index) => index !== chordIndex);
      return newLines;
    });
  };

  const addProgressionLine = () => {
    setProgressionLines(prev => [...prev, []]);
    setCurrentLine(progressionLines.length);
  };

  const removeProgressionLine = (lineIndex) => {
    if (progressionLines.length > 1) {
      setProgressionLines(prev => prev.filter((_, index) => index !== lineIndex));
      if (currentLine >= progressionLines.length - 1) {
        setCurrentLine(Math.max(0, progressionLines.length - 2));
      }
    }
  };

  const clearProgression = () => {
    setProgressionLines([[]]);
    setCurrentLine(0);
  };

  const setCurrentProgressionLine = (lineIndex) => {
    setCurrentLine(lineIndex);
  };

  return (
    <ChordPanelContext.Provider value={{
      selectedChords,
      addChord,
      removeChord,
      clearChords,
      isHighlighted,
      // Progression state
      progressionLines,
      currentLine,
      addChordToProgression,
      removeChordFromProgression,
      addProgressionLine,
      removeProgressionLine,
      clearProgression,
      setCurrentProgressionLine
    }}>
      {children}
    </ChordPanelContext.Provider>
  );
};

export default ChordPanelContext;