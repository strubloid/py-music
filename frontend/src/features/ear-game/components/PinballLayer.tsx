import React from 'react'

const PinballLayer = ({ combo }) => (
  <div className="pinball-layer" aria-hidden="true">
    <span className="pinball-layer__multiplier">{combo}x</span>
    <i />
    <i />
    <i />
    <b />
    <b />
  </div>
)

export default React.memo(PinballLayer)
