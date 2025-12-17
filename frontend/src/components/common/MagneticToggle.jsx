import React from 'react';
import { Magnet, Move } from 'lucide-react';
import { useMagneticBorder } from '../../contexts/MagneticBorderContext';
import './MagneticToggle.css';

const MagneticToggle = () => {
  const { isMagneticEnabled, toggleMagnetic } = useMagneticBorder();

  return (
    <button
      className={`magnetic-toggle ${isMagneticEnabled ? 'active' : ''}`}
      onClick={toggleMagnetic}
      title={isMagneticEnabled ? 'Disable Magnetic Borders' : 'Enable Magnetic Borders'}
    >
      {isMagneticEnabled ? (
        <Magnet className="magnetic-icon" size={18} />
      ) : (
        <Move className="magnetic-icon" size={18} />
      )}
      <span className="magnetic-label">
        {isMagneticEnabled ? 'Magnetic' : 'Free Move'}
      </span>
    </button>
  );
};

export default MagneticToggle;