import React, { useState, useRef, useEffect } from 'react';
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
  const [dynamicPosition, setDynamicPosition] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const panelRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if panel goes off-screen and adjust position
  useEffect(() => {
    if (isExpanded && containerRef.current && panelRef.current && !isMobile) {
      const container = containerRef.current;
      const panel = panelRef.current;
      const containerRect = container.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let adjustments = {};

      // Check horizontal bounds
      if (side === 'left') {
        if (panelRect.right > viewport.width - 20) {
          // Panel goes off right edge, flip to left side of button
          adjustments.left = 'auto';
          adjustments.right = 'calc(100% + 0.75rem)';
        }
      } else if (side === 'right') {
        if (panelRect.left < 20) {
          // Panel goes off left edge, flip to right side of button
          adjustments.right = 'auto';
          adjustments.left = 'calc(100% + 0.75rem)';
        }
      }

      // Check vertical bounds
      if (panelRect.bottom > viewport.height - 20) {
        // Panel goes off bottom edge, align to bottom of button
        adjustments.top = 'auto';
        adjustments.bottom = '0';
      } else if (panelRect.top < 20) {
        // Panel goes off top edge, align to top of button
        adjustments.top = '0';
        adjustments.bottom = 'auto';
      }

      setDynamicPosition(adjustments);
    }
  }, [isExpanded, side, isMobile]);

  const getExpandIcon = () => {
    if (!isExpanded) {
      if (isMobile) return <ChevronDown size={16} />;
      switch (side) {
        case 'left': return <ChevronRight size={16} />;
        case 'right': return <ChevronLeft size={16} />;
        case 'top': return <ChevronDown size={16} />;
        case 'bottom': return <ChevronUp size={16} />;
        default: return <ChevronRight size={16} />;
      }
    } else {
      if (isMobile) return <ChevronUp size={16} />;
      switch (side) {
        case 'left': return <ChevronLeft size={16} />;
        case 'right': return <ChevronRight size={16} />;
        case 'top': return <ChevronUp size={16} />;
        case 'bottom': return <ChevronDown size={16} />;
        default: return <ChevronLeft size={16} />;
      }
    }
  };

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      ref={containerRef}
      className={`info-container info-${side} ${isExpanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile-layout' : ''} ${className}`}
      style={!isMobile ? {
        [`${side === 'left' || side === 'right' ? 'top' : 'left'}`]: 
          side === 'left' || side === 'right' 
            ? `calc(50% + ${offset * 5}rem - 2.5rem)`
            : `calc(50% + ${offset * 8}rem - 4rem)`
      } : {}}
    >
      {/* Floating Toggle Button */}
      <div 
        className="info-toggle-button" 
        onClick={handleToggleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggleClick(e);
          }
        }}
      >
        <div className="toggle-content">
          {icon && <span className="info-icon">{icon}</span>}
          <span className="info-title-compact">{title}</span>
          <span className="expand-icon">{getExpandIcon()}</span>
        </div>
      </div>

      {/* Expandable Content Panel */}
      {isExpanded && (
        <div 
          ref={panelRef}
          className="info-panel"
          style={dynamicPosition}
        >
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