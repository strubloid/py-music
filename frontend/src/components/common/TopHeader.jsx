import React, { useState, useRef, useEffect } from 'react'
import './TopHeader.css'

const TopHeader = () => {
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
    setIsDragging(true)
    dragStartY.current = e.clientY
    startHeight.current = panelHeight
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const deltaY = e.clientY - dragStartY.current
    const maxHeight = window.innerHeight * 0.5 // Max 50% of viewport
    const newHeight = Math.min(Math.max(startHeight.current + deltaY, 150), maxHeight)
    setPanelHeight(newHeight)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, panelHeight])

  return (
    <div 
      ref={panelRef}
      className="top-header"
      style={{ 
        height: activePanel ? `${panelHeight}px` : 'auto'
      }}
    >
      {/* Top Controls */}
      <div 
        className="top-controls"
        onMouseDown={activePanel ? handleMouseDown : undefined}
        style={{ cursor: activePanel ? 'ns-resize' : 'default' }}
      >
        <button
          className={`top-button ${activePanel === 'shortcuts' ? 'active' : ''}`}
          onClick={() => togglePanel('shortcuts')}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="button-icon">⚡</span>
          <span className="button-text">Shortcuts</span>
        </button>
        
        <button
          className={`top-button ${activePanel === 'favorites' ? 'active' : ''}`}
          onClick={() => togglePanel('favorites')}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="button-icon">⭐</span>
          <span className="button-text">Favorites</span>
        </button>
      </div>

      {/* Drag Handle */}
      {activePanel && (
        <div 
          className="panel-drag-handle bottom"
          onMouseDown={handleMouseDown}
        >
          <div className={`drag-indicator ${isDragging ? 'dragging' : ''}`}></div>
        </div>
      )}
      
      {/* Panel Content */}
      {activePanel && (
        <div className="top-panel-content">
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
        </div>
      )}
    </div>
  )
}

export default TopHeader