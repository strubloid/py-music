import React from 'react';
import { Flame } from 'lucide-react';
import './StreakBadge.css';

const StreakBadge = ({ streak = 0, className = '', label }) => {
  const text = label || `${streak} day streak`;

  return (
    <div className={`streak-badge-shared ${className}`.trim()}>
      <Flame size={16} />
      <span>{text}</span>
    </div>
  );
};

export default StreakBadge;
