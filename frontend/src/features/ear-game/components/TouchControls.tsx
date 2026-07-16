import React from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Zap } from 'lucide-react'

const TouchControls = ({ onAction, disabled }) => (
  <div className="touch-controls" role="group" aria-label="Touch controls">
    <button type="button" aria-label="Move left" onClick={() => onAction('move-left', 'touch')} disabled={disabled}>
      <ArrowLeft />
    </button>
    <button type="button" aria-label="Replay musical question" onClick={() => onAction('replay', 'touch')}>
      <RotateCcw />
    </button>
    <button
      type="button"
      className="touch-controls__action"
      aria-label="Commit selected answer"
      onClick={() => onAction('confirm', 'touch')}
      disabled={disabled}
    >
      <Zap />
    </button>
    <button type="button" aria-label="Move right" onClick={() => onAction('move-right', 'touch')} disabled={disabled}>
      <ArrowRight />
    </button>
  </div>
)

export default TouchControls
