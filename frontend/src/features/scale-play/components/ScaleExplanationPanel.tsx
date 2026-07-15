// Scale Explanation Panel — text feedback on note selection for Scale Lab
import React from 'react';
import '../styles/ScaleExplanationPanel.scss';

interface ScaleExplanationPanelProps {
  explanation: string | null;
  result: {
    confirmed: boolean;
    expectedPitchClasses: number[];
    missingPitchClasses: number[];
    extraPitchClasses: number[];
    message: string;
  } | null;
  rootPitch: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ScaleExplanationPanel: React.FC<ScaleExplanationPanelProps> = ({
  explanation,
  result,
  rootPitch,
}) => {
  if (!explanation && !result) return null;

  const missingNotes = result?.missingPitchClasses?.map((p) => NOTE_NAMES[p]) ?? [];
  const extraNotes = result?.extraPitchClasses?.map((p) => NOTE_NAMES[p]) ?? [];

  return (
    <div className={`se-panel ${result?.confirmed ? 'se-panel--confirmed' : ''}`}>
      {explanation && <p className="se-panel__text">{explanation}</p>}

      {result && (
        <>
          {result.confirmed ? (
            <p className="se-panel__message se-panel__message--good">
              ✓ {result.message}
            </p>
          ) : (
            <p className="se-panel__message">
              {result.message}
            </p>
          )}

          {missingNotes.length > 0 && (
            <div className="se-panel__missing">
              <span className="se-panel__missing-label">Missing notes:</span>
              <div className="se-panel__chips">
                {missingNotes.map((n) => (
                  <span key={n} className="se-chip se-chip--missing">{n}</span>
                ))}
              </div>
            </div>
          )}

          {extraNotes.length > 0 && (
            <div className="se-panel__extra">
              <span className="se-panel__extra-label">Extra notes:</span>
              <div className="se-panel__chips">
                {extraNotes.map((n) => (
                  <span key={n} className="se-chip se-chip--extra">{n}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(ScaleExplanationPanel);
