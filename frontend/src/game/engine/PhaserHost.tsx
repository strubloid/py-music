import React, { useEffect, useRef } from 'react'
import { useMotionProfile } from '../../contexts/MotionContext'

export type WorldDestination = { id: string; x: number; color: number; label: string }

type PhaserHostProps = {
  destinations: WorldDestination[]
  activeDestination?: string | null
  initialDestination?: string | null
  onDestinationNear?: (id: string | null) => void
}

const PhaserHost = ({ destinations, activeDestination, initialDestination, onDestinationNear }: PhaserHostProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const onDestinationNearRef = useRef(onDestinationNear)
  const { motion, performance } = useMotionProfile()

  useEffect(() => {
    onDestinationNearRef.current = onDestinationNear
  }, [onDestinationNear])

  useEffect(() => {
    let game: import('phaser').Game | null = null
    let disposed = false

    const mount = async () => {
      const Phaser = (await import('phaser')).default
      if (disposed || !hostRef.current) return

      class PracticeSquareScene extends Phaser.Scene {
        private pip!: import('phaser').GameObjects.Container
        private targetX = 0
        private cursors?: import('phaser').Types.Input.Keyboard.CursorKeys

        create() {
          const width = this.scale.width
          const height = this.scale.height
          const architecture = this.add.graphics()
          architecture.fillStyle(0x080b1a, 0.3)
          architecture.fillRect(0, height * 0.7, width, height * 0.3)
          architecture.lineStyle(1, 0xffc21c, 0.16)
          architecture.lineBetween(0, height * 0.7, width, height * 0.7)

          destinations.forEach((destination) => {
            const x = destination.x * width
            architecture.lineStyle(1, destination.color, 0.22)
            architecture.lineBetween(width / 2, height * 0.79, x, height * 0.7)
            architecture.lineBetween(x, height * 0.7, x, height * 0.52)
            const portal = this.add
              .circle(x, height * 0.68, 24, destination.color, 0.05)
              .setStrokeStyle(2, destination.color, 0.68)
            const core = this.add
              .circle(x, height * 0.68, 8, destination.color, 0.18)
              .setStrokeStyle(1, destination.color, 0.9)
            this.tweens.add({
              targets: [portal, core],
              alpha: motion === 'minimal' ? 0.8 : { from: 0.5, to: 0.95 },
              duration: 2200,
              yoyo: true,
              repeat: motion === 'minimal' ? 0 : -1,
              ease: 'Sine.easeInOut',
            })
          })

          const halo = this.add.circle(0, 0, 14, 0xffc21c, 0.08).setStrokeStyle(1, 0xffc21c, 0.56)
          const body = this.add.circle(0, 0, 6, 0xffc21c)
          const stem = this.add.rectangle(5, -12, 2, 18, 0xffc21c).setOrigin(0.5, 1)
          const rememberedDestination = destinations.find((destination) => destination.id === initialDestination)
          const initialX = rememberedDestination ? rememberedDestination.x * width : width / 2
          this.pip = this.add.container(initialX, height * 0.76, [halo, stem, body])
          this.targetX = this.pip.x

          if (this.input.keyboard) this.cursors = this.input.keyboard.createCursorKeys()
          this.input.on('pointerdown', (pointer: import('phaser').Input.Pointer) => {
            this.targetX = pointer.x
          })
        }

        update(_time: number, delta: number) {
          const speed = performance === 'low' ? 0.24 : 0.32
          if (this.cursors?.left.isDown) this.targetX = this.pip.x - 4
          if (this.cursors?.right.isDown) this.targetX = this.pip.x + 4
          this.targetX = Phaser.Math.Clamp(this.targetX, 30, this.scale.width - 30)
          this.pip.x = Phaser.Math.Linear(this.pip.x, this.targetX, Math.min(1, (speed * delta) / 16))

          let nearest: string | null = null
          let nearestDistance = Number.POSITIVE_INFINITY
          destinations.forEach((destination) => {
            const distance = Math.abs(this.pip.x - destination.x * this.scale.width)
            if (distance < nearestDistance && distance < 64) {
              nearest = destination.id
              nearestDistance = distance
            }
          })
          onDestinationNearRef.current?.(nearest)
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        transparent: true,
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
        physics: { default: 'arcade' },
        input: { keyboard: true, mouse: true, touch: true },
        render: {
          antialias: performance !== 'low',
          powerPreference: performance === 'high' ? 'high-performance' : 'default',
        },
        scene: PracticeSquareScene,
        banner: false,
      })
    }

    void mount()
    return () => {
      disposed = true
      game?.destroy(true)
      if (hostRef.current) hostRef.current.replaceChildren()
    }
  }, [destinations, initialDestination, motion, performance])

  useEffect(() => {
    if (!activeDestination) return
    onDestinationNearRef.current?.(activeDestination)
  }, [activeDestination])

  return <div ref={hostRef} className="phaser-world" aria-hidden="true" />
}

export default PhaserHost
