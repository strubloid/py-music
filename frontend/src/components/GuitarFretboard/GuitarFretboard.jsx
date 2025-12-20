import React, { useRef, useEffect, useState } from 'react'
import Card from '../common/Card'
import PracticeTip from '../common/PracticeTip'
import { MAX_FRETS, DEFAULT_FRET_COUNT, MIN_FRET_COUNT, PRESET_FRET_COUNTS } from '../../config/musicConfig.tsx'
import './GuitarFretboard.css'

const GuitarFretboard = ({ fretboardData }) => {
  const scrollRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const [scrollState, setScrollState] = useState({ left: false, right: true, showStringNames: true, isScrolling: false })
  const [fretCount, setFretCount] = useState(DEFAULT_FRET_COUNT)
  const [isHoveringSelector, setIsHoveringSelector] = useState(false)

  // Handle scroll detection for fade indicators and string name visibility
  useEffect(() => {
    const handleScroll = () => {
      const element = scrollRef.current
      if (!element) return

      const scrollPos = element.scrollLeft
      const isScrolledLeft = scrollPos > 10
      const isScrolledRight = 
        scrollPos < element.scrollWidth - element.clientWidth - 10

      // Show string names when at start (0-50px) or scrolled far right (>150px)
      const showStringNames = scrollPos < 50 || scrollPos > 150

      // Set scrolling state
      setScrollState({ 
        left: isScrolledLeft, 
        right: isScrolledRight,
        showStringNames,
        isScrolling: true
      })

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollState(prev => ({ 
          ...prev,
          isScrolling: false
        }))
      }, 150)
    }

    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      // Initial check
      setTimeout(handleScroll, 100)
      
      return () => {
        element.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [fretCount])  // Recalculate when fret count changes

  return (
    <Card title="🎸 Guitar Fretboard" size="large" className="fretboard-container">
      
      {/* Outstanding Fret Count Selector */}
      <div className="fret-selector-container">
        <div className="fret-selector-header">
          
          <div className="fret-count-display">
            <span className="count-number">{fretCount}</span>
            <span className="count-label">frets</span>
          </div>
        </div>
        
        <div 
          className={`fret-neck-selector ${isHoveringSelector ? 'hovering' : ''}`}
          onMouseEnter={() => setIsHoveringSelector(true)}
          onMouseLeave={() => setIsHoveringSelector(false)}
        >
          {/* Guitar neck visual */}
          <div className="neck-visual">
            {Array.from({ length: MAX_FRETS }, (_, i) => (
              <div 
                key={i} 
                className={`fret-dot ${i < fretCount ? 'active' : ''} ${[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(i + 1) ? 'marker' : ''}`}
                style={{ left: `${(i / MAX_FRETS) * 100}%` }}
              >
                {[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(i + 1) && (
                  <span className="dot-number">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Interactive range slider */}
          <input
            type="range"
            min={MIN_FRET_COUNT}
            max={MAX_FRETS}
            value={fretCount}
            onChange={(e) => setFretCount(Number(e.target.value))}
            className="fret-range-input"
          />
          
          {/* String lines for visual effect */}
          <div className="neck-strings">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="neck-string" style={{ top: `${(i / 5) * 100}%` }}></div>
            ))}
          </div>
        </div>
        
        {/* Quick preset buttons */}
        <div className="fret-presets">
          {PRESET_FRET_COUNTS.map(count => (
            <button
              key={count}
              onClick={() => setFretCount(count)}
              className={`preset-btn ${fretCount === count ? 'active' : ''}`}
            >
              <span className="preset-count">{count}</span>
              <span className="preset-icon">🎸</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="fretboard-wrapper">
        <div 
          ref={scrollRef}
          className={`fretboard-scroll ${scrollState.left ? 'scrolled-left' : ''} ${!scrollState.right ? 'scrolled-right' : ''} ${scrollState.showStringNames ? 'show-string-names' : 'hide-string-names'}`}
        >
        <div className="fretboard-content">
          {/* Fret number headers */}
          <div className="fret-headers">
            <div className="string-label-header"></div>
            {Array.from({ length: fretCount + 1 }, (_, i) => (
              <div key={i} className="fret-number">
                {i}
              </div>
            ))}
          </div>

          {/* Fretboard strings */}
          <div className="strings-container">
            {fretboardData.map((stringData, stringIndex) => (
              <div key={stringIndex} className="guitar-string">
                {/* String name */}
                <div className="string-name">
                  {stringData.string}
                </div>
                
                {/* Frets */}
                <div className="frets-row">
                  {stringData.frets.slice(0, fretCount + 1).map((fret, fretIndex) => (
                    <div
                      key={fretIndex}
                      className="fret-cell"
                    >
                      {/* Fret wire (vertical line) */}
                      {fretIndex > 0 && (
                        <div className="fret-wire"></div>
                      )}
                      
                      {/* String (horizontal line) */}
                      <div className="guitar-string-line"></div>
                      
                      {/* Note dot */}
                      {fret.is_scale_note && (
                        <div
                          className={`note-dot ${
                            fret.is_root ? 'root-note' : 'scale-note'
                          }`}
                          title={`${fret.note} - Fret ${fret.fret}`}
                        >
                          {fret.note}
                        </div>
                      )}
                      
                      {/* Fret markers for common positions */}
                      {([3, 5, 7, 9, 12].includes(fretIndex) && !fret.is_scale_note) && (
                        <div className="fret-marker"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right fade overlay - positioned outside scroll container */}
      <div className={`fretboard-fade-overlay ${(scrollState.right && !scrollState.isScrolling) ? '' : 'hidden'}`}></div>
    </div>

      {/* Legend */}
      <div className="fretboard-legend">
        <div className="legend-item">
          <div className="legend-dot root"></div>
          <span>Root Note</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot scale"></div>
          <span>Scale Notes</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot marker"></div>
          <span>Fret Markers</span>
        </div>
      </div>

      <PracticeTip>
        <p className="practice-tip-text">Have fun auround this, as it will be helpfull to you to get familiar with the fretboard and gain muscle memory.</p>
        <p className="practice-tip-text">When I started... I was in shame of not being able to do chords, yeah! chords were a hardworking skill, so I prattice another thing, Scales!</p>
        <p className="practice-tip-text">After a lot of scales! specialy G for some reason, I got the jist of it, but one thing for sure, you will have some favorites in your heart.</p>
        <p className="practice-tip-text">So... Stop your worries, the craic is having fun, be prepared, get your "mood" in shape, an open your brain to possibilities!</p>
      </PracticeTip>
    </Card>
  )
}

export default GuitarFretboard