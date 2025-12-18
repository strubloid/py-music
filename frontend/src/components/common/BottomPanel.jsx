import React, { useState, useRef, useEffect } from 'react'

import ProgressionBuilder from './ProgressionBuilder'
import './BottomPanel.css'

const BottomPanel = ({ scaleData }) => {
  const [activePanel, setActivePanel] = useState(null)
  const [panelHeight, setPanelHeight] = useState(400)
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
    
    const deltaY = dragStartY.current - e.clientY
    const newHeight = Math.min(Math.max(startHeight.current + deltaY, 200), window.innerHeight * 0.8)
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
      className="bottom-panel"
      style={{ height: activePanel ? `${panelHeight}px` : 'auto' }}
    >
      {/* Drag Handle */}
      {activePanel && (
        <div 
          className="panel-drag-handle"
          onMouseDown={handleMouseDown}
        >
          <div className={`drag-indicator ${isDragging ? 'dragging' : ''}`}></div>
        </div>
      )}
      
      {/* Bottom Controls */}
      <div className="bottom-controls">
        <button
          className={`bottom-button ${activePanel === 'progression' ? 'active' : ''}`}
          onClick={() => togglePanel('progression')}
        >
          <span className="button-icon">🎼</span>
          <span className="button-text">Building Progressions</span>
        </button>
      </div>

      {/* Panel Content */}
      {activePanel && (
        <div className="bottom-panel-content">
          {activePanel === 'progression' && <ProgressionBuilder scaleData={scaleData} />}
        </div>
      )}
    </div>
  )
}

export default BottomPanel