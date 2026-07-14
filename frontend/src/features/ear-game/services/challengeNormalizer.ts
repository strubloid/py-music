const CATEGORY_MAP = {
  interval: 'interval',
  direction: 'direction',
  shape: 'melodic-memory',
  chord_quality: 'chord-quality',
  chord_movement: 'chord-pair',
  chord_pair: 'chord-pair',
  inversion: 'chord-pair',
  scale_degree: 'scale-degree',
  progression: 'progression',
};

const noteEvents = (exercise) => {
  if (exercise.chords?.length) {
    return exercise.chords.flatMap((chord, chordIndex) => chord.map((note) => ({
      note,
      time: chordIndex * 1.45,
      duration: 1.15,
      velocity: 110,
    })));
  }
  return (exercise.notes || []).map((note, index) => ({
    note,
    time: index * 0.65,
    duration: 0.55,
    velocity: 110,
  }));
};

export const normalizeEarChallenge = (raw, { instrumentId = 'piano' } = {}) => {
  const exercise = raw.exercise || raw;
  const id = String(raw.id);
  const answers = (exercise.options || raw.options || []).map((label, lane) => ({
    id: `${id}-answer-${lane}`,
    label,
    shortLabel: label,
    accessibleLabel: `Lane ${lane + 1}: ${label}`,
    lane,
  }));
  const correctIndex = exercise.correct_index ?? raw.correct_index;
  const playbackMode = exercise.chords?.length > 1
    ? 'sequence'
    : exercise.chords?.length === 1
      ? 'harmonic'
      : 'melodic';
  return {
    id,
    sourceChallengeId: raw.id,
    category: CATEGORY_MAP[exercise.type] || 'interval',
    type: exercise.type,
    title: exercise.title || raw.title,
    question: exercise.question || raw.question,
    difficulty: raw.difficulty || 1,
    xpReward: raw.xp_reward || 25,
    prompt: {
      events: noteEvents(exercise),
      playbackMode,
      instrumentId,
      tempo: playbackMode === 'sequence' ? 78 : 96,
      rootContext: exercise.chordDefinitions?.[0]?.root || null,
      notes: exercise.notes || null,
      chords: exercise.chords || null,
    },
    answers,
    correctAnswerId: answers[correctIndex]?.id || null,
    explanation: {
      summary: exercise.explanation || raw.explanation || `The answer is ${answers[correctIndex]?.label || 'shown above'}.`,
      formula: exercise.chordDefinitions?.[0]?.intervals || null,
      correctLabel: answers[correctIndex]?.label || '',
    },
    controls: {
      replay: true,
      slowReplay: true,
      compare: true,
      hints: true,
    },
    analytics: {
      source: 'daily-challenge',
      answerMode: exercise.answer_mode,
      relationship: exercise.relationship || null,
    },
    raw,
  };
};
