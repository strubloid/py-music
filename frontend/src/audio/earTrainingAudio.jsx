import { Reverb, SampleLoader, Soundfont, SplendidGrandPiano } from 'smplr';

const PRE_ROLL_SECONDS = 0.08;
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
      await instrument.ready;
      loadedInstrumentIds = Array.from(new Set([...loadedInstrumentIds, instrumentId]));
      return instrument;
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
    playComparison,
    stop,
    dispose,
  };
};
