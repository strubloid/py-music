import React, { createContext, useContext, useState, useEffect } from 'react';

const ChordDisplayContext = createContext();

export const useChordDisplay = () => {
  const context = useContext(ChordDisplayContext);
  if (!context) {
    throw new Error('useChordDisplay must be used within ChordDisplayProvider');
  }
  return context;
};

export const ChordDisplayProvider = ({ children }) => {
  // Default to guitar, but load from localStorage if available
  const [displayMode, setDisplayMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chordDisplayMode') || 'guitar';
    }
    return 'guitar';
  });

  // Show chord diagrams vs text - default to true (show diagrams)
  const [showChordDiagrams, setShowChordDiagrams] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showChordDiagrams');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save to localStorage when mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chordDisplayMode', displayMode);
    }
  }, [displayMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showChordDiagrams', JSON.stringify(showChordDiagrams));
    }
  }, [showChordDiagrams]);

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'guitar' ? 'piano' : 'guitar');
  };

  const toggleChordDiagrams = () => {
    setShowChordDiagrams(prev => !prev);
  };

  return (
    <ChordDisplayContext.Provider value={{ 
      displayMode, 
      setDisplayMode, 
      toggleDisplayMode,
      showChordDiagrams,
      setShowChordDiagrams,
      toggleChordDiagrams
    }}>
      {children}
    </ChordDisplayContext.Provider>
  );
};

export default ChordDisplayContext;