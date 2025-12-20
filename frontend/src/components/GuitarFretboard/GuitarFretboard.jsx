import React, { useRef, useEffect, useState } from 'react'
import Card from '../common/Card'
import PracticeTip from '../common/PracticeTip'
import './GuitarFretboard.css'

const GuitarFretboard = ({ fretboardData }) => {
  const scrollRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const [scrollState, setScrollState] = useState({ left: false, right: true, showStringNames: true, isScrolling: false })

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
  }, [])

  return (
    <Card title="🎸 Guitar Fretboard" size="large" className="fretboard-container">
      
      <div className="fretboard-wrapper">
        <div 
          ref={scrollRef}
          className={`fretboard-scroll ${scrollState.left ? 'scrolled-left' : ''} ${!scrollState.right ? 'scrolled-right' : ''} ${scrollState.showStringNames ? 'show-string-names' : 'hide-string-names'}`}
        >
        <div className="fretboard-content">
          {/* Fret number headers */}
          <div className="fret-headers">
            <div className="string-label-header"></div>
            {Array.from({ length: 13 }, (_, i) => (
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
                  {stringData.frets.map((fret, fretIndex) => (
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
      <div className={`fretboard-fade-overlay ${(!scrollState.right || scrollState.isScrolling) ? 'hidden' : ''}`}></div>
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