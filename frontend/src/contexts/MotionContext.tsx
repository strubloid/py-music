import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  detectMotionProfile,
  detectPerformanceProfile,
  MOTION_PROFILE_KEY,
  PERFORMANCE_PROFILE_KEY,
  type MotionProfile,
  type PerformanceProfile,
} from '../game/engine/performanceProfile'

type MotionContextValue = {
  motion: MotionProfile
  performance: PerformanceProfile
  setMotion: (value: MotionProfile) => void
  setPerformance: (value: PerformanceProfile) => void
}

const MotionContext = createContext<MotionContextValue | null>(null)
const readStored = <T extends string>(key: string, allowed: readonly T[], fallback: () => T): T => {
  if (typeof window === 'undefined') return fallback()
  const value = window.localStorage.getItem(key) as T | null
  return value && allowed.includes(value) ? value : fallback()
}

export const MotionProvider = ({ children }: { children: React.ReactNode }) => {
  const [motion, setMotionState] = useState<MotionProfile>(() =>
    readStored(MOTION_PROFILE_KEY, ['full', 'comfort', 'minimal'], detectMotionProfile),
  )
  const [performance, setPerformanceState] = useState<PerformanceProfile>(() =>
    readStored(PERFORMANCE_PROFILE_KEY, ['high', 'balanced', 'low'], detectPerformanceProfile),
  )

  const setMotion = (value: MotionProfile) => {
    setMotionState(value)
    localStorage.setItem(MOTION_PROFILE_KEY, value)
  }
  const setPerformance = (value: PerformanceProfile) => {
    setPerformanceState(value)
    localStorage.setItem(PERFORMANCE_PROFILE_KEY, value)
  }

  useEffect(() => {
    document.documentElement.dataset.motion = motion
    document.documentElement.dataset.performance = performance
  }, [motion, performance])

  const value = useMemo(() => ({ motion, performance, setMotion, setPerformance }), [motion, performance])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export const useMotionProfile = () => {
  const value = useContext(MotionContext)
  if (!value) throw new Error('useMotionProfile must be used inside MotionProvider')
  return value
}

// Compatibility name used by game screens and Settings. Keep one context and
// one source of truth rather than introducing a second motion hook.
export const useMotion = () => {
  const value = useMotionProfile()
  return {
    ...value,
    preference: value.motion,
    setPreference: value.setMotion,
  }
}
