import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './PracticeTip.css';

const PracticeTip = ({ title = "🎯 Practice Tip", children, initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <div className="practice-tip">
      <div 
        className="practice-tip-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="practice-tip-title">{title}</h4>
        <button className="practice-tip-toggle">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="practice-tip-content">
          {typeof children === 'string' ? (
            <p className="practice-tip-text">{children}</p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeTip;