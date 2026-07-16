import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGameProgress } from '../../contexts/GameProgressContext'
import {
  completeActivity,
  mutateFocus,
  recordAnalyticsEvent,
  startActivity,
  useSoundGatesPower,
} from '../../services/api'

const makeKey = (activity: string) => {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${activity}-${random}`
}

export const useActivitySession = (activity: string, active: boolean) => {
  const { isLoggedIn } = useAuth()
  const { setFocusBalance, showCityReward } = useGameProgress()
  const sessionKeyRef = useRef(makeKey(activity))
  const startedRef = useRef(false)
  const startPromiseRef = useRef<Promise<boolean> | null>(null)
  const completedRef = useRef(false)
  const [generation, setGeneration] = useState(0)
  const [status, setStatus] = useState<'idle' | 'starting' | 'active' | 'complete' | 'error'>('idle')

  useEffect(() => {
    if (!active || !isLoggedIn || startedRef.current) return
    startedRef.current = true
    setStatus('starting')
    startPromiseRef.current = startActivity(activity, sessionKeyRef.current)
      .then(({ data }) => {
        setFocusBalance(data.focus_points)
        if (data.reward) showCityReward(data.reward)
        setStatus('active')
        recordAnalyticsEvent('activity_start', activity).catch(() => undefined)
        return true
      })
      .catch(() => {
        startedRef.current = false
        setStatus('error')
        return false
      })
  }, [active, activity, generation, isLoggedIn, setFocusBalance, showCityReward])

  const finish = useCallback(async () => {
    if (!isLoggedIn || !startedRef.current || completedRef.current) return null
    completedRef.current = true
    try {
      const { data } = await completeActivity(sessionKeyRef.current)
      setFocusBalance(data.focus_points)
      setStatus('complete')
      recordAnalyticsEvent('activity_complete', activity, { result: 'complete' }).catch(() => undefined)
      return data
    } catch (error) {
      completedRef.current = false
      throw error
    }
  }, [activity, isLoggedIn, setFocusBalance])

  const spendFocus = useCallback(
    async (amount: number, reason: string) => {
      if (!isLoggedIn || !startedRef.current || completedRef.current) return false
      if (startPromiseRef.current && !(await startPromiseRef.current)) return false
      const transactionKey = `${sessionKeyRef.current}-${reason}-${Date.now()}`
      try {
        const { data } = await mutateFocus({
          transactionKey,
          operation: 'spend',
          reason,
          amount,
          sessionKey: sessionKeyRef.current,
        })
        setFocusBalance(data.focus_points)
        recordAnalyticsEvent('focus_spend', activity).catch(() => undefined)
        return true
      } catch (error: any) {
        if (Number.isFinite(error?.response?.data?.focus_points)) {
          setFocusBalance(error.response.data.focus_points)
        }
        return false
      }
    },
    [activity, isLoggedIn, setFocusBalance],
  )

  const activateSoundPower = useCallback(
    async (powerId: string, challengeId: number | string) => {
      if (!isLoggedIn || !startedRef.current || completedRef.current) return null
      if (startPromiseRef.current && !(await startPromiseRef.current)) return null
      const transactionKey = `${sessionKeyRef.current}-${challengeId}-${powerId}`.slice(0, 100)
      try {
        const { data } = await useSoundGatesPower({
          transactionKey,
          sessionKey: sessionKeyRef.current,
          challengeId,
          powerId,
        })
        setFocusBalance(data.focus_points)
        recordAnalyticsEvent('focus_spend', activity).catch(() => undefined)
        return data
      } catch (error: any) {
        if (Number.isFinite(error?.response?.data?.focus_points)) {
          setFocusBalance(error.response.data.focus_points)
        }
        return null
      }
    },
    [activity, isLoggedIn, setFocusBalance],
  )

  const reset = useCallback(() => {
    sessionKeyRef.current = makeKey(activity)
    startedRef.current = false
    startPromiseRef.current = null
    completedRef.current = false
    setStatus('idle')
    setGeneration((value) => value + 1)
  }, [activity])

  return { sessionKey: sessionKeyRef.current, status, finish, spendFocus, activateSoundPower, reset }
}
