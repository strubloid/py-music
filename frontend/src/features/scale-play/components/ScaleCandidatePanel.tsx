// Scale Candidate Panel — shows compatible scale families for Scale Lab
import React from 'react';
import type { ScaleLabCandidate } from '../state/scaleLabReducer';
import { getNoteNameFromPitch } from '../services/scaleCandidateAnalysis';
import '../styles/ScaleCandidatePanel.scss';

interface ScaleCandidatePanelProps {
  candidates: ScaleLabCandidate[];
  rootPitch: number;
  targetMode?: string;
}

const ScaleCandidatePanel: React.FC<ScaleCandidatePanelProps> = ({
  candidates,
  rootPitch,
  targetMode,
}) => {
  if (candidates.length === 0) {
    return (
      <div className="sc-panel">
        <h3 className="sc-panel__title">Compatible Scales</h3>
        <p className="sc-panel__empty">
          Place at least 3 notes to see compatible scale families.
        </p>
      </div>
    );
  }

  return (
    <div className="sc-panel">
      <h3 className="sc-panel__title">
        {targetMode ? 'Target Scale' : 'Compatible Scales'}
      </h3>
      <ul className="sc-panel__list" role="list">
        {candidates.map((c) => {
          const isTarget = c.modeKey === targetMode;
          const missing = c.missingPitchClasses
            .slice(0, 3)
            .map((p) => getNoteNameFromPitch(p))
            .join(', ');
          return (
            <li
              key={`${c.modeKey}-${c.modeName}`}
              className={`sc-candidate ${isTarget ? 'sc-candidate--target' : ''}`}
            >
              <div className="sc-candidate__header">
                <span className="sc-candidate__name">{c.modeName}</span>
                <span className="sc-candidate__match">{c.matchCount} notes</span>
              </div>
              {missing && (
                <div className="sc-candidate__missing">
                  Missing: {missing}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default React.memo(ScaleCandidatePanel);
