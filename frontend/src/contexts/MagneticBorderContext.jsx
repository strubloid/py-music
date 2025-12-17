import React, { createContext, useContext, useState, useEffect } from 'react';

const MagneticBorderContext = createContext();

export const useMagneticBorder = () => {
  const context = useContext(MagneticBorderContext);
  if (!context) {
    throw new Error('useMagneticBorder must be used within a MagneticBorderProvider');
  }
  return context;
};

export const MagneticBorderProvider = ({ children }) => {
  const [isMagneticEnabled, setIsMagneticEnabled] = useState(() => {
    // Load from localStorage or default to true
    const saved = localStorage.getItem('magneticBorderEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('magneticBorderEnabled', JSON.stringify(isMagneticEnabled));
  }, [isMagneticEnabled]);

  const toggleMagnetic = () => {
    setIsMagneticEnabled(!isMagneticEnabled);
  };

  return (
    <MagneticBorderContext.Provider 
      value={{ 
        isMagneticEnabled, 
        toggleMagnetic 
      }}
    >
      {children}
    </MagneticBorderContext.Provider>
  );
};