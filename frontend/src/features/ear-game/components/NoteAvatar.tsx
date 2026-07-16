import React from 'react'

const NoteAvatar = ({ lane = 0, laneCount = 1, state = 'idle', reducedMotion = false, legacy = false }) => {
  const left = laneCount > 0 ? ((lane + 0.5) / laneCount) * 100 : 50
  if (legacy) {
    return (
      <div
        className={`nomi nomi--${state} ${reducedMotion ? 'nomi--reduced-motion' : ''}`}
        style={{ '--nomi-lane': `${left}%` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 84 112" role="presentation">
          <path className="nomi-flag" d="M54 12v45c11-7 19-4 23 2-8-2-15 1-23 8" />
          <path className="nomi-stem" d="M54 13v62" />
          <ellipse className="nomi-body" cx="38" cy="75" rx="26" ry="22" transform="rotate(-16 38 75)" />
          <circle className="nomi-eye" cx="29" cy="70" r="2.8" />
          <circle className="nomi-eye" cx="43" cy="67" r="2.8" />
          <path className="nomi-mouth" d="M31 80q7 7 15-1" />
          <path className="nomi-leg" d="M29 94l-4 10-8 1" />
          <path className="nomi-leg" d="M47 94l5 9 8-1" />
        </svg>
        <span className="nomi-aura" />
      </div>
    )
  }
  return (
    <div
      className={`player-mascot player-mascot--${state} ${reducedMotion ? 'player-mascot--reduced-motion' : ''}`}
      style={{ '--lane-x': `${left}%` }}
      data-avatar-lane={lane}
      data-avatar-state={state}
      aria-hidden="true"
    >
      <span className="player-mascot__trail" />
      <svg viewBox="0 0 84 112" role="presentation">
        <path className="player-mascot__flag" d="M54 12v45c11-7 19-4 23 2-8-2-15 1-23 8" />
        <path className="player-mascot__stem" d="M54 13v62" />
        <ellipse className="player-mascot__body" cx="38" cy="75" rx="26" ry="22" transform="rotate(-16 38 75)" />
        <circle className="player-mascot__eye" cx="29" cy="70" r="2.8" />
        <circle className="player-mascot__eye" cx="43" cy="67" r="2.8" />
        <path className="player-mascot__mouth" d="M31 80q7 7 15-1" />
        <path className="player-mascot__leg" d="M29 94l-4 10-8 1" />
        <path className="player-mascot__leg" d="M47 94l5 9 8-1" />
      </svg>
      <span className="player-mascot__ring" />
    </div>
  )
}

export default React.memo(NoteAvatar)
