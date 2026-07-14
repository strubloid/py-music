import React from 'react';

const SideScrollerLayer = ({ lane, laneCount, stageStep }) => (
  <div className="side-scroller-layer" aria-hidden="true" style={{ '--stage-lane-count': laneCount }}>
    <div className="side-scroller-layer__skyline" />
    <div className="side-scroller-layer__route">
      {Array.from({ length: laneCount }, (_, index) => <span key={index} className={index === lane ? 'side-scroller-layer__platform is-active' : 'side-scroller-layer__platform'}><i>♪</i></span>)}
    </div>
    <div className="side-scroller-layer__portal"><i>✦</i><span>{stageStep === 5 ? 'REWARD VAULT' : 'NEXT STAGE'}</span></div>
  </div>
);

export default React.memo(SideScrollerLayer);
