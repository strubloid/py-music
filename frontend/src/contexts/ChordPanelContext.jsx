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

  return (
    <ChordPanelContext.Provider value={{
      selectedChords,
      addChord,
      removeChord,
      clearChords,
      isHighlighted
    }}>
      {children}
    </ChordPanelContext.Provider>
  );
};

export default ChordPanelContext;