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

  // Save to localStorage when mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chordDisplayMode', displayMode);
    }
  }, [displayMode]);

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'guitar' ? 'piano' : 'guitar');
  };

  return (
    <ChordDisplayContext.Provider value={{ 
      displayMode, 
      setDisplayMode, 
      toggleDisplayMode 
    }}>
      {children}
    </ChordDisplayContext.Provider>
  );
};

export default ChordDisplayContext;