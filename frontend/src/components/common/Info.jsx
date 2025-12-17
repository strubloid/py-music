import React, { useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import './Info.css';

const Info = ({ 
  title, 
  icon, 
  children, 
  side = 'left', 
  offset = 0,
  initialExpanded = false,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isVisible, setIsVisible] = useState(true);

  const getExpandIcon = () => {
    if (!isExpanded) {
      switch (side) {
        case 'left': return <ChevronRight size={16} />;
        case 'right': return <ChevronLeft size={16} />;
        case 'top': return <ChevronDown size={16} />;
        case 'bottom': return <ChevronUp size={16} />;
        default: return <ChevronRight size={16} />;
      }
    } else {
      switch (side) {
        case 'left': return <ChevronLeft size={16} />;
        case 'right': return <ChevronRight size={16} />;
        case 'top': return <ChevronUp size={16} />;
        case 'bottom': return <ChevronDown size={16} />;
        default: return <ChevronLeft size={16} />;
      }
    }
  };

  return (
    <div 
      className={`info-container info-${side} ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}
      style={{
        [`${side === 'left' || side === 'right' ? 'top' : 'left'}`]: 
          side === 'left' || side === 'right' 
            ? `calc(50% + ${offset * 5}rem - 2.5rem)`
            : `calc(50% + ${offset * 8}rem - 4rem)`
      }}
    >
      {/* Floating Toggle Button */}
      <div className="info-toggle-button" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="toggle-content">
          {icon && <span className="info-icon">{icon}</span>}
          <span className="info-title-compact">{title}</span>
          <span className="expand-icon">{getExpandIcon()}</span>
        </div>
      </div>

      {/* Expandable Content Panel */}
      {isExpanded && (
        <div className="info-panel">
          <div className="info-header">
            <div className="info-title-with-icon">
              {icon && <span className="info-symbol">{icon}</span>}
              <h3 className="info-title">{title}</h3>
            </div>
            <div className="info-controls">
              <button 
                className="visibility-button"
                onClick={() => setIsVisible(!isVisible)}
                title={isVisible ? 'Hide content' : 'Show content'}
              >
                {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button 
                className="close-button"
                onClick={() => setIsExpanded(false)}
                title="Collapse panel"
              >
                {getExpandIcon()}
              </button>
            </div>
          </div>
          
          {isVisible && (
            <div className="info-content">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Info;