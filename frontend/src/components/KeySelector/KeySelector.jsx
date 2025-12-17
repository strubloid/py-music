import React from 'react'
import Card from '../common/Card'
import Button from '../common/Button'
import './KeySelector.css'

const KeySelector = ({ selectedKey, onKeyChange, selectedInterval, onIntervalChange, availableIntervals, loading }) => {
  const keys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ]
  
  const intervals = availableIntervals || [
    { key: 'major', name: 'Major' },
    { key: 'minor', name: 'Minor' }
  ]



  return (
    <div className="key-selector-container">
      {/* Key Selector */}
      <Card title="Select Key" className="key-selector-section">
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
      </Card>

      {/* Interval Selector */}
      <Card title="Select Interval" className="interval-selector-section">
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
      </Card>
    </div>
  )
}

export default KeySelector