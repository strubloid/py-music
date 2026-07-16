import * as Tone from 'tone'
import { AUDIO_MIX_EVENT, getAudioLevel, type AudioMixCategory } from './audioMix'

class MusicTransport {
  private started = false
  private analyser = new Tone.Analyser('fft', 64)
  private output = new Tone.Volume(0).toDestination()
  private synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.18, sustain: 0.25, release: 0.8 },
  }).connect(this.analyser)

  constructor(private category: AudioMixCategory) {
    this.analyser.connect(this.output)
    this.applyMix()
    window.addEventListener(AUDIO_MIX_EVENT, this.applyMix)
  }

  private applyMix = () => {
    const level = getAudioLevel(this.category)
    this.output.volume.value = level === 0 ? -Infinity : Tone.gainToDb(level)
  }

  async unlock() {
    await Tone.start()
    this.started = true
  }

  get isUnlocked() {
    return this.started
  }
  get analysis() {
    return this.analyser.getValue()
  }

  playArrival(notes: string[] = ['C4', 'E4', 'G4']) {
    if (!this.started) return false
    const now = Tone.now()
    notes.forEach((note, index) => this.synth.triggerAttackRelease(note, '8n', now + index * 0.12, 0.32))
    return true
  }

  dispose() {
    window.removeEventListener(AUDIO_MIX_EVENT, this.applyMix)
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.synth.dispose()
    this.analyser.dispose()
    this.output.dispose()
  }
}

export const createMusicTransport = (category: AudioMixCategory = 'musicalPrompt') => new MusicTransport(category)
