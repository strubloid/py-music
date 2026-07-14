import { Reverb, SampleLoader, Soundfont, SplendidGrandPiano } from 'smplr';

const PRE_ROLL_SECONDS = 0.08;
const SAMPLE_LOAD_TIMEOUT_MS = 8_000;
const PIANO_NOTES_TO_LOAD = [48, 55, 60, 67, 72];
const PIANO_PROXY_BASE_URL = '/api/audio-proxy/piano';
const GUITAR_PROXY_URL = '/api/audio-proxy/soundfont/FluidR3_GM/acoustic_guitar_steel';

export const EAR_TRAINING_INSTRUMENTS = [
  {
    id: 'piano',
    label: 'Piano',
    description: 'Sampled grand piano',
  },
  {
    id: 'guitar',
    label: 'Guitar',
    description: 'Sampled acoustic guitar',
  },
];

const createBrowserAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio is not available in this browser.');
  }

  return new AudioContextClass();
};

const createFallbackInstrument = (context) => {
  let voices = [];
  const stop = () => {
    voices.forEach(({ oscillator, gain }) => {
      try { oscillator.stop(); } catch { /* Voice already ended. */ }
      oscillator.disconnect();
      gain.disconnect();
    });
    voices = [];
  };

  return {
    start: ({ note, time, duration = 0.5, velocity = 108 }) => {
      const midi = Number.isFinite(Number(note)) ? Number(note) : 60;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const level = Math.min(0.22, Math.max(0.04, Number(velocity) / 600));
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440 * (2 ** ((midi - 69) / 12)), time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(level, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.03);
      voices.push({ oscillator, gain });
      oscillator.addEventListener('ended', () => {
        voices = voices.filter((voice) => voice.oscillator !== oscillator);
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
    },
    stop,
    dispose: stop,
  };
};

const buildInstrument = (context, loader, instrumentId, onLoadProgress) => {
  if (instrumentId === 'guitar') {
    const guitar = Soundfont(context, {
      instrumentUrl: GUITAR_PROXY_URL,
      loader,
      volume: 108,
      velocity: 108,
      onLoadProgress,
    });

    guitar.output.addEffect('reverb', Reverb(context), 0.08);
    return guitar;
  }

  const piano = SplendidGrandPiano(context, {
    baseUrl: PIANO_PROXY_BASE_URL,
    loader,
    volume: 104,
    velocity: 104,
    decayTime: 0.9,
    formats: ['ogg', 'm4a'],
    notesToLoad: {
      notes: PIANO_NOTES_TO_LOAD,
      velocityRange: [1, 127],
    },
    onLoadProgress,
  });

  piano.output.addEffect('reverb', Reverb(context), 0.14);
  return piano;
};

export const createEarTrainingAudioEngine = ({ onStateChange } = {}) => {
  let context = null;
  let loader = null;
  let loadingInstrumentId = null;
  let instruments = {};
  let loadedInstrumentIds = [];
  let loadProgressByInstrument = {};

  const emitState = () => {
    onStateChange?.({
      audioReady: Boolean(context),
      loadingInstrumentId,
      loadedInstrumentIds,
      loadProgressByInstrument,
    });
  };

  const ensureContext = async () => {
    if (!context) {
      context = createBrowserAudioContext();
      loader = SampleLoader(context);
      emitState();
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    return context;
  };

  const loadInstrument = async (instrumentId) => {
    await ensureContext();

    if (instruments[instrumentId]) {
      return instruments[instrumentId];
    }

    loadingInstrumentId = instrumentId;
    emitState();

    const instrument = buildInstrument(context, loader, instrumentId, (progress) => {
      loadProgressByInstrument = {
        ...loadProgressByInstrument,
        [instrumentId]: progress,
      };
      emitState();
    });

    instruments = {
      ...instruments,
      [instrumentId]: instrument,
    };

    try {
      await Promise.race([
        instrument.ready,
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('Sample loading timed out.')), SAMPLE_LOAD_TIMEOUT_MS)),
      ]);
      loadedInstrumentIds = Array.from(new Set([...loadedInstrumentIds, instrumentId]));
      return instrument;
    } catch {
      instrument.dispose();
      const fallback = createFallbackInstrument(context);
      instruments = { ...instruments, [instrumentId]: fallback };
      loadedInstrumentIds = Array.from(new Set([...loadedInstrumentIds, instrumentId]));
      return fallback;
    } finally {
      loadingInstrumentId = null;
      emitState();
    }
  };

  const playInterval = async ({ instrumentId, mode, rootToneNote, targetToneNote, timingScale = 1, includeRootAnchor = false }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = context.currentTime + PRE_ROLL_SECONDS;
    const baseDuration = 0.46 * timingScale;
    const targetDuration = 0.62 * timingScale;
    const noteGap = 0.55 * timingScale;

    instrument.stop();

    if (mode === 'harmonic') {
      instrument.start({ note: rootToneNote, time: startTime, duration: 0.95 * timingScale, velocity: 112 });
      instrument.start({ note: targetToneNote, time: startTime, duration: 0.95 * timingScale, velocity: 112 });
      return { durationMs: Math.round(1000 * timingScale) };
    }

    instrument.start({ note: rootToneNote, time: startTime, duration: baseDuration, velocity: 110 });

    if (includeRootAnchor) {
      instrument.start({ note: rootToneNote, time: startTime + noteGap, duration: baseDuration, velocity: 105 });
      instrument.start({ note: targetToneNote, time: startTime + (noteGap * 2), duration: targetDuration, velocity: 116 });
      return { durationMs: Math.round((1300 * timingScale) + (noteGap * 1000)) };
    }

    instrument.start({ note: targetToneNote, time: startTime + noteGap, duration: targetDuration, velocity: 116 });

    return { durationMs: Math.round(1300 * timingScale) };
  };

  const playNoteSequence = async ({ instrumentId, notes, timingScale = 1 }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = context.currentTime + PRE_ROLL_SECONDS;
    const gap = 0.48 * timingScale;

    instrument.stop();
    notes.forEach((note, index) => {
      instrument.start({
        note,
        time: startTime + (index * gap),
        duration: 0.42 * timingScale,
        velocity: index === notes.length - 1 ? 116 : 108,
      });
    });

    return { durationMs: Math.round((notes.length * gap + 0.35) * 1000) };
  };

  const playChord = async ({ instrumentId, notes, timingScale = 1 }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = context.currentTime + PRE_ROLL_SECONDS;

    instrument.stop();
    notes.forEach((note) => {
      instrument.start({ note, time: startTime, duration: 1.2 * timingScale, velocity: 110 });
    });

    return { durationMs: Math.round(1400 * timingScale) };
  };

  const playChordSequence = async ({ instrumentId, chords, timingScale = 1 }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = context.currentTime + PRE_ROLL_SECONDS;
    const gap = 1.08 * timingScale;

    instrument.stop();
    chords.forEach((chord, chordIndex) => {
      chord.forEach((note) => {
        instrument.start({
          note,
          time: startTime + (chordIndex * gap),
          duration: 0.9 * timingScale,
          velocity: 110,
        });
      });
    });

    return { durationMs: Math.round((chords.length * gap + 0.3) * 1000) };
  };

  const playComparison = async ({ instrumentId, rootToneNote, originalToneNote, selectedToneNote }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = context.currentTime + PRE_ROLL_SECONDS;

    instrument.stop();
    instrument.start({ note: rootToneNote, time: startTime, duration: 0.36, velocity: 106 });
    instrument.start({ note: originalToneNote, time: startTime + 0.46, duration: 0.5, velocity: 116 });
    instrument.start({ note: rootToneNote, time: startTime + 1.18, duration: 0.36, velocity: 106 });
    instrument.start({ note: selectedToneNote, time: startTime + 1.64, duration: 0.5, velocity: 108 });

    return { durationMs: 2400 };
  };

  const stop = () => {
    Object.values(instruments).forEach((instrument) => {
      instrument.stop();
    });
  };

  const preloadInstrument = async (instrumentId) => {
    try {
      await loadInstrument(instrumentId);
    } catch {
      // Best-effort warmup only.
    }
  };

  const dispose = () => {
    Object.values(instruments).forEach((instrument) => {
      instrument.dispose();
    });

    instruments = {};
    loadedInstrumentIds = [];
    loadProgressByInstrument = {};
    loadingInstrumentId = null;

    if (context && context.state !== 'closed') {
      context.close().catch(() => {});
    }

    context = null;
    loader = null;
    emitState();
  };

  return {
    ensureContext,
    loadInstrument,
    preloadInstrument,
    playInterval,
    playNoteSequence,
    playChord,
    playChordSequence,
    playComparison,
    stop,
    dispose,
  };
};
