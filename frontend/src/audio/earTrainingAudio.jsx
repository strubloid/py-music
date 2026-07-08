import { Reverb, SampleLoader, Soundfont, SplendidGrandPiano } from 'smplr';
import * as Tone from 'tone';

const PRE_ROLL_SECONDS = 0.08;
const PIANO_NOTES_TO_LOAD = [48, 52, 55, 60, 64, 67, 72, 76, 79, 84];

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

const addReverbIfSupported = (context, instrument, mix) => {
  try {
    if (typeof window.AudioWorkletNode === 'undefined') {
      return;
    }

    instrument.output.addEffect('reverb', Reverb(context), mix);
  } catch {
    // Dry playback fallback.
  }
};

const createSampledInstrument = (context, loader, instrumentId, onLoadProgress) => {
  if (instrumentId === 'guitar') {
    const guitar = Soundfont(context, {
      instrument: 'acoustic_guitar_steel',
      kit: 'FluidR3_GM',
      loader,
      volume: 108,
      velocity: 108,
      onLoadProgress,
    });

    addReverbIfSupported(context, guitar, 0.08);
    return guitar;
  }

  const piano = SplendidGrandPiano(context, {
    loader,
    volume: 104,
    velocity: 104,
    decayTime: 0.9,
    formats: ['m4a', 'ogg'],
    notesToLoad: {
      notes: PIANO_NOTES_TO_LOAD,
      velocityRange: [1, 127],
    },
    onLoadProgress,
  });

  addReverbIfSupported(context, piano, 0.14);
  return piano;
};

const createLocalToneInstrument = (instrumentId) => {
  if (instrumentId === 'guitar') {
    const synth = new Tone.PolySynth(Tone.Synth, {
      volume: -10,
      oscillator: { type: 'triangle3' },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0.02,
        release: 0.28,
      },
    });
    const highpass = new Tone.Filter(180, 'highpass');
    const lowpass = new Tone.Filter(2200, 'lowpass');
    const output = new Tone.Gain(0.82);
    synth.chain(highpass, lowpass, output, Tone.Destination);

    return {
      engine: 'local',
      ready: Promise.resolve(),
      start: ({ note, time, duration, velocity }) => {
        synth.triggerAttackRelease(note, duration, time, velocity / 127);
      },
      stop: () => {
        synth.releaseAll();
      },
      dispose: () => {
        synth.dispose();
        highpass.dispose();
        lowpass.dispose();
        output.dispose();
      },
    };
  }

  const synth = new Tone.PolySynth(Tone.FMSynth, {
    volume: -8,
    harmonicity: 2.2,
    modulationIndex: 8,
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.003,
      decay: 0.24,
      sustain: 0.18,
      release: 0.9,
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.18,
      sustain: 0.1,
      release: 0.5,
    },
  });
  const lowpass = new Tone.Filter(3200, 'lowpass');
  const output = new Tone.Gain(0.9);
  synth.chain(lowpass, output, Tone.Destination);

  return {
    engine: 'local',
    ready: Promise.resolve(),
    start: ({ note, time, duration, velocity }) => {
      synth.triggerAttackRelease(note, duration, time, velocity / 127);
    },
    stop: () => {
      synth.releaseAll();
    },
    dispose: () => {
      synth.dispose();
      lowpass.dispose();
      output.dispose();
    },
  };
};

const shouldFallbackToLocal = (error) => {
  const message = `${error?.message || error || ''}`.toLowerCase();

  return (
    message.includes('content security policy')
    || message.includes('connect-src')
    || message.includes('refused to connect')
    || message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('unable to load a worklet')
    || message.includes('audioworklet')
    || message.includes('aborterror')
  );
};

export const createEarTrainingAudioEngine = ({ onStateChange } = {}) => {
  let browserContext = null;
  let sampleLoader = null;
  let loadingInstrumentId = null;
  let instruments = {};
  let loadedInstrumentIds = [];
  let loadProgressByInstrument = {};
  let sampledAudioBlocked = false;

  const emitState = () => {
    onStateChange?.({
      audioReady: Boolean(browserContext) || Tone.context.state === 'running',
      loadingInstrumentId,
      loadedInstrumentIds,
      loadProgressByInstrument,
    });
  };

  const ensureContext = async () => {
    await Tone.start();

    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    if (!browserContext) {
      browserContext = createBrowserAudioContext();
      sampleLoader = SampleLoader(browserContext);
    }

    if (browserContext.state === 'suspended') {
      await browserContext.resume();
    }

    emitState();
    return browserContext;
  };

  const loadSampledInstrument = async (instrumentId) => {
    const instrument = createSampledInstrument(browserContext, sampleLoader, instrumentId, (progress) => {
      loadProgressByInstrument = {
        ...loadProgressByInstrument,
        [instrumentId]: progress,
      };
      emitState();
    });

    await instrument.ready;
    return {
      ...instrument,
      engine: 'sampled',
    };
  };

  const loadInstrument = async (instrumentId) => {
    await ensureContext();

    if (instruments[instrumentId]) {
      return instruments[instrumentId];
    }

    loadingInstrumentId = instrumentId;
    emitState();

    try {
      let instrument;

      if (!sampledAudioBlocked) {
        try {
          instrument = await loadSampledInstrument(instrumentId);
        } catch (error) {
          if (!shouldFallbackToLocal(error)) {
            throw error;
          }

          sampledAudioBlocked = true;
          instrument = createLocalToneInstrument(instrumentId);
        }
      } else {
        instrument = createLocalToneInstrument(instrumentId);
      }

      instruments = {
        ...instruments,
        [instrumentId]: instrument,
      };
      loadedInstrumentIds = Array.from(new Set([...loadedInstrumentIds, instrumentId]));
      return instrument;
    } finally {
      loadingInstrumentId = null;
      emitState();
    }
  };

  const playInterval = async ({ instrumentId, mode, rootToneNote, targetToneNote }) => {
    const instrument = await loadInstrument(instrumentId);
    const startTime = instrument.engine === 'sampled'
      ? browserContext.currentTime + PRE_ROLL_SECONDS
      : Tone.now() + PRE_ROLL_SECONDS;

    instrument.stop();

    if (mode === 'harmonic') {
      instrument.start({ note: rootToneNote, time: startTime, duration: 0.95, velocity: 112 });
      instrument.start({ note: targetToneNote, time: startTime, duration: 0.95, velocity: 112 });
      return { durationMs: 1000 };
    }

    instrument.start({ note: rootToneNote, time: startTime, duration: 0.46, velocity: 110 });
    instrument.start({ note: targetToneNote, time: startTime + 0.55, duration: 0.62, velocity: 116 });
    return { durationMs: 1300 };
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

    if (browserContext && browserContext.state !== 'closed') {
      browserContext.close().catch(() => {});
    }

    browserContext = null;
    sampleLoader = null;
    sampledAudioBlocked = false;
    emitState();
  };

  return {
    ensureContext,
    loadInstrument,
    preloadInstrument,
    playInterval,
    stop,
    dispose,
  };
};
