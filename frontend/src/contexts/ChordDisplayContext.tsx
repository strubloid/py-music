import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChordDisplayContext = createContext();

export const useChordDisplay = () => {
  const context = useContext(ChordDisplayContext);
  if (!context) {
    throw new Error('useChordDisplay must be used within ChordDisplayProvider');
  }
  return context;
};

export const ChordDisplayProvider = ({ children }) => {
  const { user } = useAuth();

  const getDefaultInstrument = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('chordDisplayMode') : null;
    if (saved) return saved;
    if (user?.instrument_preference && user.instrument_preference !== 'both') {
      return user.instrument_preference;
    }
    return 'guitar';
  };

  const [displayMode, setDisplayMode] = useState(getDefaultInstrument);

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