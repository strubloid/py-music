import React, { useEffect, useRef } from 'react'
import { useMotionProfile } from '../../contexts/MotionContext'
import { profileBudget } from './performanceProfile'

const PixiBackground = () => {
  const hostRef = useRef<HTMLDivElement>(null)
  const { motion, performance } = useMotionProfile()

  useEffect(() => {
    let cleanup = () => undefined
    let cancelled = false

    const mount = async () => {
      const PIXI = await import('pixi.js')
      if (cancelled || !hostRef.current) return
      const app = new PIXI.Application()
      await app.init({ resizeTo: hostRef.current, backgroundAlpha: 0, antialias: performance !== 'low' })
      if (cancelled || !hostRef.current) {
        app.destroy(true)
        return
      }
      hostRef.current.appendChild(app.canvas)

      const budget = profileBudget(performance)
      const particles = Array.from({ length: motion === 'minimal' ? 4 : budget.particles }, (_, index) => {
        const dot = new PIXI.Graphics().circle(0, 0, 1 + (index % 3)).fill(index % 5 === 0 ? 0x42d8ff : 0xffc21c)
        dot.alpha = 0.18 + (index % 4) * 0.08
        dot.x = (index * 97) % Math.max(1, app.screen.width)
        dot.y = (index * 53) % Math.max(1, app.screen.height)
        app.stage.addChild(dot)
        return dot
      })
      const ticker = (tickerState: import('pixi.js').Ticker) => {
        if (motion === 'minimal') return
        particles.forEach((dot, index) => {
          dot.y -= (0.08 + (index % 4) * 0.025) * tickerState.deltaTime
          if (dot.y < -8) dot.y = app.screen.height + 8
        })
      }
      app.ticker.add(ticker)
      cleanup = () => {
        app.ticker.remove(ticker)
        app.destroy(true, { children: true })
      }
    }

    void mount()
    return () => {
      cancelled = true
      cleanup()
      if (hostRef.current) hostRef.current.replaceChildren()
    }
  }, [motion, performance])

  return <div ref={hostRef} className="pixi-background" aria-hidden="true" />
}

export default PixiBackground
