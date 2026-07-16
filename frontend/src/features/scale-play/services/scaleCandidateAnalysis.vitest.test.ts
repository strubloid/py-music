import { describe, expect, it } from 'vitest';
import { analyzeCandidates, notePitchClass } from './scaleCandidateAnalysis';

describe('Scale Lab candidate analysis', () => {
  it('preserves sharp pitch classes instead of collapsing them to naturals', () => {
    expect(notePitchClass('C#4')).toBe(1);
    expect(notePitchClass('F#')).toBe(6);
    expect(notePitchClass('C4')).toBe(0);
  });

  it('recognizes an exact C Dorian collection among client-side previews', () => {
    const candidates = analyzeCandidates(
      ['C', 'D', 'D#', 'F', 'G', 'A', 'A#'].map((note) => ({ note })),
      'dorian',
    );
    expect(candidates.some((candidate) => candidate.modeKey === 'dorian' && candidate.extraPitchClasses.length === 0)).toBe(true);
  });
});
