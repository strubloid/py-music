import React from 'react'
import Button from '../common/Button'
import './KeySelector.scss'

const KeySelector = ({ selectedKey, onKeyChange, loading, selectedInterval, onIntervalChange, availableIntervals }) => {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  // If interval props are passed (legacy callers), render the dual-section layout
  const showInterval = selectedInterval !== undefined && onIntervalChange && availableIntervals

  const intervals = availableIntervals || [
    { key: 'major', name: 'Major' },
    { key: 'minor', name: 'Minor' }
  ]

  return (
    <div className="key-selector-container">
      <div className="key-selector-section">
        <div className="keys-grid">
          {keys.map((key) => (
            <Button
              key={key}
              variant={selectedKey === key ? 'primary' : 'secondary'}
              selected={selectedKey === key}
              onClick={() => onKeyChange(key)}
              disabled={loading}
              className={key.includes('#') ? 'sharp-key' : ''}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>
      {showInterval && (
        <div className="interval-selector-section">
          <div className="intervals-grid">
            {intervals.map((interval) => (
              <Button
                key={interval.key}
                variant={selectedInterval === interval.key ? 'primary' : 'secondary'}
                selected={selectedInterval === interval.key}
                onClick={() => onIntervalChange(interval.key)}
                disabled={loading}
                size="large"
              >
                {interval.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default KeySelector
