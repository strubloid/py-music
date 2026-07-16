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
          this.add.rectangle(width / 2, height * 0.82, width, height * 0.38, 0x10163a, 0.82)
          this.add.ellipse(width / 2, height * 0.84, width * 0.95, height * 0.22, 0x26205e, 0.6)

          destinations.forEach((destination) => {
            const x = destination.x * width
            const tower = this.add
              .rectangle(x, height * 0.5, 88, 170, destination.color, 0.24)
              .setStrokeStyle(2, destination.color, 0.8)
            const portal = this.add
              .ellipse(x, height * 0.67, 56, 82, destination.color, 0.22)
              .setStrokeStyle(3, destination.color, 0.9)
            this.tweens.add({
              targets: [tower, portal],
              alpha: motion === 'minimal' ? 0.85 : { from: 0.55, to: 1 },
              duration: 1800,
              yoyo: true,
              repeat: motion === 'minimal' ? 0 : -1,
              ease: 'Sine.easeInOut',
            })
          })

          const body = this.add.circle(0, 0, 20, 0xffc21c).setStrokeStyle(3, 0x070a18)
          const stem = this.add.rectangle(15, -25, 7, 38, 0xffc21c).setOrigin(0.5, 1)
          const eyeL = this.add.circle(-7, -3, 3, 0x070a18)
          const eyeR = this.add.circle(6, -3, 3, 0x070a18)
          const rememberedDestination = destinations.find((destination) => destination.id === initialDestination)
          const initialX = rememberedDestination ? rememberedDestination.x * width : width / 2
          this.pip = this.add.container(initialX, height * 0.76, [stem, body, eyeL, eyeR])
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
