import React from 'react';
import { Atom, CheckCircle2, FlaskConical, Sparkles } from 'lucide-react';
import type { ScaleLabState } from '../state/scaleLabReducer';
import '../styles/ScaleExplanationPanel.scss';

interface ScaleExplanationPanelProps {
  explanation: string | null;
  result: ScaleLabState['verifiedResult'];
  rootPitch: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ScaleExplanationPanel: React.FC<ScaleExplanationPanelProps> = ({ explanation, result }) => {
  if (!explanation && !result) return null;
  const missingNotes = result?.missingPitchClasses?.map((pitch) => NOTE_NAMES[pitch]) ?? [];
  const extraNotes = result?.extraPitchClasses?.map((pitch) => NOTE_NAMES[pitch]) ?? [];

  return (
    <section className={`sound-formula ${result?.confirmed ? 'is-confirmed' : ''}`} aria-label="Sound Formula analysis">
      <header className="sound-formula__header">
        <FlaskConical size={18} />
        <div><span>Sound Formula</span><strong>{result?.analysisEngine === 'music21' ? 'music21 laboratory analysis' : 'Awaiting analysis'}</strong></div>
      </header>

      {result && (
        <>
          <div className="sound-formula__equation" aria-label={`Formula ${result.formulaText}`}>
            {result.formula.map((degree, index) => <React.Fragment key={`${degree}-${index}`}><b>{degree}</b>{index < result.formula.length - 1 && <i>+</i>}</React.Fragment>)}
          </div>
          <p className="sound-formula__character"><Atom size={16} /> Characteristic degree: <strong>{result.characteristicDegree}</strong></p>
          <p className={`sound-formula__message ${result.confirmed ? 'is-good' : ''}`}>
            {result.confirmed && <CheckCircle2 size={17} />} {result.message}
          </p>

          {(missingNotes.length > 0 || extraNotes.length > 0) && (
            <div className="sound-formula__corrections">
              {missingNotes.length > 0 && <p><span>Add</span> {missingNotes.join(' · ')}</p>}
              {extraNotes.length > 0 && <p><span>Outside formula</span> {extraNotes.join(' · ')}</p>}
            </div>
          )}

          <div className="sound-formula__intervals">
            <span>Your measured intervals</span>
            <strong>{result.selectedIntervals.length ? result.selectedIntervals.join(' · ') : 'Place notes to measure intervals'}</strong>
          </div>

          <div className="sound-formula__candidates">
            <h3><Sparkles size={15} /> Closest formulas</h3>
            {result.candidates.slice(0, 4).map((candidate) => (
              <article key={`${candidate.root}-${candidate.mode}`} className={candidate.confirmed ? 'is-exact' : ''}>
                <div><strong>{candidate.root} {candidate.name}</strong><span>{candidate.formulaText}</span></div>
                <b>{candidate.matchCount}/7</b>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default React.memo(ScaleExplanationPanel);
