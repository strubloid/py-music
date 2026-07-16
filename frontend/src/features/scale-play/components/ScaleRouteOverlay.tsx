// Route overlay for Scale Path — shows connected rails, degree markers, gap portal, Nomi token
import React from 'react'
import type { ScalePathFragment } from '../state/scalePathReducer'
import '../styles/ScaleRouteOverlay.scss'

interface ScaleRouteOverlayProps {
  fragment: ScalePathFragment
  correctAnswer: ScalePathFragment['anchor'] | null
  reducedMotion: boolean
}

const ScaleRouteOverlay: React.FC<ScaleRouteOverlayProps> = ({ fragment, correctAnswer, reducedMotion }) => {
  const { anchor, suffix = [] } = fragment
  const nodes = [anchor, ...suffix]
  if (correctAnswer) {
    nodes.push(correctAnswer)
  }

  return (
    <div className="route-overlay" aria-hidden="true">
      <div className="route-overlay__label">
        Route: {fragment.root} {fragment.mode}
      </div>

      <div className="route-overlay__nodes">
        {nodes.map((node, i) => (
          <div key={i} className="route-node">
            <div className="route-node__dot" />
            <div className="route-node__info">
              <span className="route-node__note">{node.note}</span>
              <span className="route-node__fret">
                {node.string}@{node.fret}
              </span>
            </div>
          </div>
        ))}

        {!correctAnswer && (
          <>
            <div className="route-gap" aria-label="gap portal" />
            <div className="route-node route-node--gap">
              <div className="route-node__dot route-node__dot--gap" />
              <span className="route-node__label">?</span>
            </div>
          </>
        )}
      </div>

      <div className="route-overlay__nomi" aria-label="current position marker">
        <span className="route-nomi">♪</span>
      </div>
    </div>
  )
}

export default React.memo(ScaleRouteOverlay)
