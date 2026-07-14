import React from 'react';

const SideScrollerLayer = ({ lane, laneCount, stageStep, portalLabel, portalDisabled, onPortalActivate }) => (
  <div className="side-scroller-layer" style={{ '--stage-lane-count': laneCount }}>
    <div className="side-scroller-layer__skyline" aria-hidden="true" />
    <div className="side-scroller-layer__route" aria-hidden="true">
      {Array.from({ length: laneCount }, (_, index) => <span key={index} className={index === lane ? 'side-scroller-layer__platform is-active' : 'side-scroller-layer__platform'}><i>♪</i></span>)}
    </div>
    <button type="button" className="side-scroller-layer__portal" disabled={portalDisabled} onClick={onPortalActivate} aria-label={portalLabel}><i>✦</i><span>{portalLabel}</span></button>
  </div>
);

export default React.memo(SideScrollerLayer);
