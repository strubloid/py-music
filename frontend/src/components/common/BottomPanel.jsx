import React, { useState } from 'react'

import ProgressionBuilder from './ProgressionBuilder'
import './BottomPanel.css'

const BottomPanel = ({ scaleData }) => {
  const [activePanel, setActivePanel] = useState(null)

  const togglePanel = (panelType) => {
    setActivePanel(activePanel === panelType ? null : panelType)
  }

  return (
    <div className="bottom-panel">
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