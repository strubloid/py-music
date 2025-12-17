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
    const existingIndex = selectedChords.findIndex(c => c.name === chord);
    
    if (existingIndex !== -1) {
      // Chord already exists, highlight it
      setHighlightedChord(chord);
      setTimeout(() => setHighlightedChord(null), 1500); // Remove highlight after 1.5s
    } else {
      // Add new chord
      const newChord = {
        id: Date.now() + Math.random(),
        name: chord,
        addedAt: new Date()
      };
      setSelectedChords(prev => [...prev, newChord]);
    }
  };

  const removeChord = (chordId) => {
    setSelectedChords(prev => prev.filter(c => c.id !== chordId));
  };

  const clearAll = () => {
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
      clearAll,
      isHighlighted
    }}>
      {children}
    </ChordPanelContext.Provider>
  );
};

export default ChordPanelContext;