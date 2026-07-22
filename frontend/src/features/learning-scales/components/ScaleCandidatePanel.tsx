// Scale Candidate Panel — shows compatible scale families for Scale Lab.
// Each candidate is a button: clicking it adopts the candidate as the
// target scale so the build board can show whether the placed notes fit.

import React from 'react'
import type { ScaleLabCandidate } from '../state/scaleLabReducer'
import { getNoteNameFromPitch } from '../services/scaleCandidateAnalysis'
import '../styles/ScaleCandidatePanel.scss'

interface ScaleCandidatePanelProps {
  candidates: ScaleLabCandidate[]
  rootPitch: number
  targetMode?: string
  onSelectCandidate: (modeKey: string) => void
}

const ScaleCandidatePanel: React.FC<ScaleCandidatePanelProps> = ({
  candidates,
  rootPitch,
  targetMode,
  onSelectCandidate,
}) => {
  if (candidates.length === 0) {
    return (
      <div className="sc-panel">
        <h3 className="sc-panel__title">Compatible Scales</h3>
        <p className="sc-panel__empty">Place at least 3 notes to see compatible scale families.</p>
      </div>
    )
  }

  return (
    <div className="sc-panel">
      <h3 className="sc-panel__title">{targetMode ? 'Compatible Scales' : 'Compatible Scales'}</h3>
      <p className="sc-panel__hint">
        {targetMode
          ? 'Click a different scale to retarget the build board, or clear the target badge above.'
          : 'Click a scale to make it the target. The build board will then show how your notes fit.'}
      </p>
      <ul className="sc-panel__list" role="list">
        {candidates.map((c) => {
          const isTarget = c.modeKey === targetMode
          const missing = c.missingPitchClasses
            .slice(0, 3)
            .map((p) => getNoteNameFromPitch(p))
            .join(', ')
          return (
            <li key={`${c.modeKey}-${c.modeName}`}>
              <button
                type="button"
                className={`sc-candidate ${isTarget ? 'sc-candidate--target' : ''}`}
                onClick={() => onSelectCandidate(c.modeKey)}
                aria-pressed={isTarget}
                aria-label={`Set ${c.modeName} as the target scale (${c.matchCount} of your notes match)`}
              >
                <div className="sc-candidate__header">
                  <span className="sc-candidate__name">{c.modeName}</span>
                  <span className="sc-candidate__match">{c.matchCount} notes</span>
                </div>
                {missing && <div className="sc-candidate__missing">Missing: {missing}</div>}
                {isTarget && <div className="sc-candidate__current">Current target</div>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default React.memo(ScaleCandidatePanel)
