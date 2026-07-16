// Fragment HUD — shows the prompt, degree clue, and difficulty tier for Scale Path
import React from 'react'
import type { ScalePathFragment } from '../state/scalePathReducer'
import '../styles/ScaleFragmentHud.scss'

interface ScaleFragmentHudProps {
  fragment: ScalePathFragment | null
  fragmentIndex: number
  fragmentCount: number
  combo: number
  correctCount: number
  score: number
  phase: string
}

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — One gap',
  2: 'Tier 2 — Three candidates',
  3: 'Tier 3 — Two gaps',
  4: 'Tier 4 — Position + pitch',
  5: 'Tier 5 — Sparse route',
}

const ScaleFragmentHud: React.FC<ScaleFragmentHudProps> = ({
  fragment,
  fragmentIndex,
  fragmentCount,
  combo,
  correctCount,
  score,
  phase,
}) => {
  if (!fragment) return null

  const tier = fragment.difficulty ?? 1
  const directionLabel = fragment.direction === 'left' ? '← higher fret on same string' : '↑ adjacent higher string'

  return (
    <div className="sf-hud">
      <div className="sf-hud__progress">
        <span className="sf-hud__fraction">
          {fragmentIndex + 1}
          <span className="sf-hud__sep">/</span>
          {fragmentCount}
        </span>
        <div className="sf-hud__dots" aria-label={`Fragment ${fragmentIndex + 1} of ${fragmentCount}`}>
          {Array.from({ length: fragmentCount }, (_, i) => (
            <div
              key={i}
              className={`sf-hud__dot ${i < fragmentIndex ? 'done' : i === fragmentIndex ? 'current' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="sf-hud__stats">
        <div className="sf-hud__stat">
          <span className="sf-hud__stat-label">Combo</span>
          <strong className="sf-hud__stat-value">{combo}</strong>
        </div>
        <div className="sf-hud__stat">
          <span className="sf-hud__stat-label">Correct</span>
          <strong className="sf-hud__stat-value">{correctCount}</strong>
        </div>
        <div className="sf-hud__stat">
          <span className="sf-hud__stat-label">Score</span>
          <strong className="sf-hud__stat-value">{score}</strong>
        </div>
      </div>

      <div className="sf-hud__prompt">
        <p className="sf-hud__prompt-text">
          Continue the{' '}
          <strong>
            {fragment.root} {fragment.mode}
          </strong>{' '}
          scale. Direction: {directionLabel}.
        </p>
        <p className="sf-hud__degree">
          Degree clue: <span className="sf-hud__degree-val">{fragment.degreeClue}</span>
        </p>
      </div>

      <div className="sf-hud__tier">
        <span className={`sf-hud__tier-badge tier-${tier}`}>{TIER_LABELS[tier] ?? `Tier ${tier}`}</span>
      </div>
    </div>
  )
}

export default React.memo(ScaleFragmentHud)
