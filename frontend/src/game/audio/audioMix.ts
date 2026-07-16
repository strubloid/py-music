export type AudioMixCategory = 'musicalPrompt' | 'worldAmbience' | 'uiFeedback' | 'foley' | 'reward' | 'accessibility'
export type AudioMix = Record<AudioMixCategory, number>

export const AUDIO_MIX_STORAGE_KEY = 'strubloid:audio-mix'
export const AUDIO_MIX_EVENT = 'strubloid:audio-mix-change'
export const DEFAULT_AUDIO_MIX: AudioMix = {
  musicalPrompt: 1,
  worldAmbience: 0.55,
  uiFeedback: 0.7,
  foley: 0.55,
  reward: 0.72,
  accessibility: 0.85,
}

export const readAudioMix = (): AudioMix => {
  try {
    const stored = JSON.parse(localStorage.getItem(AUDIO_MIX_STORAGE_KEY) || '{}')
    return Object.fromEntries(
      Object.entries(DEFAULT_AUDIO_MIX).map(([key, fallback]) => {
        const value = Number(stored[key])
        return [key, Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback]
      }),
    ) as AudioMix
  } catch {
    return { ...DEFAULT_AUDIO_MIX }
  }
}

export const getAudioLevel = (category: AudioMixCategory) => readAudioMix()[category]

export const saveAudioMix = (mix: AudioMix) => {
  localStorage.setItem(AUDIO_MIX_STORAGE_KEY, JSON.stringify(mix))
  window.dispatchEvent(new CustomEvent(AUDIO_MIX_EVENT, { detail: mix }))
}
