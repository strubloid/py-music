import React, { useState, useRef, useEffect } from 'react'
import ChordDisplaySwitch from './ChordDisplaySwitch'
import ChordsToggle from './ChordsToggle'
import './TopHeader.css'

const TopHeader = ({ type = 'floating' }) => {
  const [activePanel, setActivePanel] = useState(null)
  const [panelHeight, setPanelHeight] = useState(200)
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef(null)
  const dragStartY = useRef(0)
  const startHeight = useRef(0)

  const togglePanel = (panelType) => {
    setActivePanel(activePanel === panelType ? null : panelType)
  }

  const handleMouseDown = (e) => {
    if (type === 'block') return // No dragging in block mode
    
    setIsDragging(true)
    dragStartY.current = e.clientY
    startHeight.current = panelHeight
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging || type === 'block') return
    
    const deltaY = e.clientY - dragStartY.current
    const maxHeight = window.innerHeight * 0.5 // Max 50% of viewport
    const newHeight = Math.min(Math.max(startHeight.current + deltaY, 150), maxHeight)
    setPanelHeight(newHeight)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging && type === 'floating') {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, panelHeight, type])

  return (
    <div 
      ref={panelRef}
      className={`top-header ${type}`}
      style={{ 
        height: activePanel && type === 'floating' ? `${panelHeight}px` : 
               activePanel && type === 'block' ? 'auto' : 'auto' 
      }}
    >
      {/* Top Controls */}
      <div 
        className="top-controls"
        onMouseDown={activePanel && type === 'floating' ? handleMouseDown : undefined}
        style={{ cursor: activePanel && type === 'floating' ? 'ns-resize' : 'default' }}
      >
        <button
          className={`top-button ${activePanel === 'shortcuts' ? 'active' : ''}`}
          onClick={() => togglePanel('shortcuts')}
          onMouseDown={(e) => type === 'floating' && e.stopPropagation()}
        >
          <span className="button-icon">⚡</span>
          <span className="button-text">Shortcuts</span>
        </button>
        
        <button
          className={`top-button ${activePanel === 'favorites' ? 'active' : ''}`}
          onClick={() => togglePanel('favorites')}
          onMouseDown={(e) => type === 'floating' && e.stopPropagation()}
        >
          <span className="button-icon">⭐</span>
          <span className="button-text">Favorites</span>
        </button>

        <button
          className={`top-button ${activePanel === 'controls' ? 'active' : ''}`}
          onClick={() => togglePanel('controls')}
          onMouseDown={(e) => type === 'floating' && e.stopPropagation()}
        >
          <span className="button-icon">🎛️</span>
          <span className="button-text">Controls</span>
        </button>
      </div>

      {/* Drag Handle - Only for floating mode */}
      {activePanel && type === 'floating' && (
        <div 
          className="panel-drag-handle bottom"
          onMouseDown={handleMouseDown}
        >
          <div className={`drag-indicator ${isDragging ? 'dragging' : ''}`}></div>
        </div>
      )}
      
      {/* Panel Content */}
      {activePanel && (
        <div className={`top-panel-content ${type}`}>
          {activePanel === 'shortcuts' && (
            <div className="shortcuts-content">
              <h3>Quick Shortcuts</h3>
              <div className="shortcuts-grid">
                <button className="shortcut-item">Quick Scale</button>
                <button className="shortcut-item">Random Progression</button>
                <button className="shortcut-item">Practice Mode</button>
                <button className="shortcut-item">Export PDF</button>
              </div>
            </div>
          )}
          
          {activePanel === 'favorites' && (
            <div className="favorites-content">
              <h3>Your Favorites</h3>
              <div className="favorites-grid">
                <div className="favorite-item">No favorites yet</div>
                <div className="favorite-item">Add some scales or progressions to your favorites!</div>
              </div>
            </div>
          )}

          {activePanel === 'controls' && (
            <div className="controls-content">
              <h3>Display Controls</h3>
              <div className="controls-grid">
                <div className="control-group">
                  <label>Chord Display:</label>
                  <ChordDisplaySwitch />
                </div>
                <div className="control-group">
                  <label>Show Chords:</label>
                  <ChordsToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TopHeader