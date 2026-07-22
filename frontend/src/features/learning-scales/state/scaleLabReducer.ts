// Scale Lab state — exploratory builder, no competitive phases

export interface LabPosition {
  string: string
  fret: number
  note: string
  stringIndex: number
  pitch: number
}

export interface ScaleLabCandidate {
  modeKey: string
  modeName: string
  matchCount: number
  missingPitchClasses: number[]
  extraPitchClasses: number[]
}

export type LabPhase = 'idle' | 'building' | 'showing-rest' | 'verified'

export interface ScaleLabState {
  phase: LabPhase
  root: string
  mode: string // target family (optional)
  rangeLevel: number // 1, 2, 3
  selectedPositions: LabPosition[] // all currently placed notes
  candidates: ScaleLabCandidate[]
  verifiedResult: {
    analysisEngine: 'music21'
    confirmed: boolean
    expectedPitchClasses: number[]
    missingPitchClasses: number[]
    extraPitchClasses: number[]
    expectedSpellings: string[]
    selectedSpellings: string[]
    selectedIntervals: string[]
    formula: string[]
    formulaText: string
    characteristicDegree: string
    candidates: Array<{
      root: string
      mode: string
      name: string
      formulaText: string
      matchCount: number
      score: number
      confirmed: boolean
    }>
    message: string
  } | null
  reducedMotion: boolean
  showAllMissing: boolean
  explanation: string | null
}

export const createInitialScaleLabState = (opts: { reducedMotion?: boolean } = {}): ScaleLabState => ({
  phase: 'idle',
  root: 'C',
  mode: 'ionian',
  rangeLevel: 1,
  selectedPositions: [],
  candidates: [],
  verifiedResult: null,
  reducedMotion: opts.reducedMotion ?? false,
  showAllMissing: false,
  explanation: null,
})

export const scaleLabReducer = (
  state: ScaleLabState,
  event: { type: string; [key: string]: unknown },
): ScaleLabState => {
  switch (event.type) {
    case 'SET_ROOT':
      return {
        ...state,
        root: event.root as string,
        selectedPositions: [],
        candidates: [],
        verifiedResult: null,
        phase: 'idle',
        explanation: null,
      }

    case 'SET_MODE':
      return {
        ...state,
        mode: event.mode as string,
        selectedPositions: [],
        candidates: [],
        verifiedResult: null,
        phase: 'idle',
        explanation: null,
      }

    case 'SET_RANGE':
      return {
        ...state,
        rangeLevel: event.level as number,
        selectedPositions: [],
        candidates: [],
        verifiedResult: null,
        phase: 'idle',
        explanation: null,
      }

    case 'TOGGLE_POSITION': {
      const pos = event.position as LabPosition
      const exists = state.selectedPositions.find((p) => p.string === pos.string && p.fret === pos.fret)
      const next = exists ? state.selectedPositions.filter((p) => p !== exists) : [...state.selectedPositions, pos]
      return {
        ...state,
        selectedPositions: next,
        phase: 'building',
        verifiedResult: null,
        explanation: null,
        showAllMissing: false,
      }
    }

    case 'CLEAR_ALL':
      return {
        ...state,
        selectedPositions: [],
        candidates: [],
        verifiedResult: null,
        phase: 'idle',
        explanation: null,
        showAllMissing: false,
      }

    case 'SET_CANDIDATES':
      return { ...state, candidates: event.candidates as ScaleLabCandidate[] }

    case 'SHOW_REST':
      return { ...state, phase: 'showing-rest', showAllMissing: true }

    case 'SET_VERIFIED':
      return {
        ...state,
        phase: 'verified',
        verifiedResult: event.result as ScaleLabState['verifiedResult'],
        explanation: (event.result as ScaleLabState['verifiedResult'])?.message ?? null,
      }

    case 'SET_EXPLANATION':
      return { ...state, explanation: event.text as string | null }

    case 'SET_REDUCED_MOTION':
      return { ...state, reducedMotion: event.value as boolean }

    default:
      return state
  }
}
