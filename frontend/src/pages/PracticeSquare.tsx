import React, { useEffect, useMemo, useRef, useState } from 'react'

import { AudioLines, FlaskConical, Headphones, Map, Music2, Route, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGameProgress } from '../contexts/GameProgressContext'
import { useMotionProfile } from '../contexts/MotionContext'
import PhaserHost, { type WorldDestination } from '../game/engine/PhaserHost'
import PixiBackground from '../game/engine/PixiBackground'
import { createMusicTransport } from '../game/audio/toneTransport'
import { useWorldTravel } from '../contexts/WorldTravelContext'
import './PracticeSquare.scss'

const DISTRICTS = [
  {
    id: 'sound-gates',
    name: 'Sound Gates',
    hint: 'Listen and follow harmony',
    path: '/play/ear-training',
    icon: Headphones,
    x: 0.15,
    color: 0x42d8ff,
    notes: ['C4', 'G4', 'E4'],
  },
  {
    id: 'scale-trail',
    name: 'Scale Trail',
    hint: 'Travel six or seven notes',
    path: '/play/scales',
    icon: Route,
    x: 0.38,
    color: 0x8ceb4a,
    notes: ['C4', 'D4', 'E4'],
  },
  {
    id: 'scale-lab',
    name: 'Scale Lab',
    hint: 'Identify a musical fragment',
    path: '/play/learn-scales',
    icon: FlaskConical,
    x: 0.62,
    color: 0xa78bfa,
    notes: ['A3', 'C4', 'E4'],
  },
  {
    id: 'quest-vaults',
    name: 'Quest Vaults',
    hint: 'Open practice missions',
    path: '/play/quests',
    icon: ShieldCheck,
    x: 0.85,
    color: 0xffc21c,
    notes: ['G3', 'C4', 'G4'],
  },
] as const

const PracticeSquare = () => {
  const { travel, lastDistrict } = useWorldTravel()
  const { user } = useAuth()
  const { progressState, rankMeta, levelMeta } = useGameProgress()
  const { motion, performance } = useMotionProfile()
  const [nearby, setNearby] = useState<string | null>(null)
  const [audioReady, setAudioReady] = useState(false)
  const transportRef = useRef<ReturnType<typeof createMusicTransport> | null>(null)
  const destinations = useMemo<WorldDestination[]>(
    () => DISTRICTS.map(({ id, name, x, color }) => ({ id, label: name, x, color })),
    [],
  )

  useEffect(() => () => transportRef.current?.dispose(), [])

  const unlockAudio = async () => {
    const transport = transportRef.current || createMusicTransport('worldAmbience')
    transportRef.current = transport
    await transport.unlock()
    transport.playArrival()
    setAudioReady(true)
  }

  const visit = (district: (typeof DISTRICTS)[number]) => {
    transportRef.current?.playArrival([...district.notes])
    travel(district)
  }

  const nextRank = rankMeta.nextRank?.name || 'City Legend'

  return (
    <div className="practice-square" data-motion={motion} data-performance={performance}>
      <PixiBackground />
      <header className="world-hud" aria-label="Player status">
        <div className="world-brand">
          <Map size={18} />
          <span>Practice Square</span>
        </div>
        <div className="hud-progress">
          <div>
            <span>Level</span>
            <strong>{user?.level || levelMeta.level}</strong>
          </div>
          <div>
            <span>Rank</span>
            <strong>{rankMeta.name}</strong>
            <small>
              {rankMeta.remainingLevels} to {nextRank}
            </small>
          </div>
          <div className="focus-orb">
            <span>Focus</span>
            <strong>{progressState.focusPoints}/10</strong>
          </div>
        </div>
      </header>

      <main className="square-stage">
        <div className="city-sky" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <PhaserHost
          destinations={destinations}
          activeDestination={nearby}
          initialDestination={lastDistrict}
          onDestinationNear={setNearby}
        />

        <section className="square-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> The Living Music City
          </span>
          <h1>
            {user?.username ? `${user.username}, where will the music take you?` : 'Where will the music take you?'}
          </h1>
          <p>
            Move with the arrow keys or choose a glowing district. Every road begins with something real to hear, play,
            or discover.
          </p>
          {!audioReady && (
            <button type="button" className="practice-listening-beacon" onClick={unlockAudio}>
              <AudioLines size={20} />
              <span>
                <strong>Wake the Listening Beacon</strong>
                <small>Required once before musical audio can play</small>
              </span>
            </button>
          )}
        </section>

        <nav className="district-platforms" aria-label="Music City districts">
          {DISTRICTS.map((district) => {
            const Icon = district.icon
            const active = nearby === district.id
            return (
              <button
                type="button"
                key={district.id}
                className={`district-platform district-${district.id} ${active ? 'is-near' : ''}`}
                onFocus={() => setNearby(district.id)}
                onBlur={() => setNearby(null)}
                onMouseEnter={() => setNearby(district.id)}
                onMouseLeave={() => setNearby(null)}
                onClick={() => visit(district)}
                aria-describedby={`${district.id}-hint`}
              >
                <span className="district-emblem">
                  <Icon size={24} />
                </span>
                <strong>{district.name}</strong>
                <small id={`${district.id}-hint`}>{district.hint}</small>
                <span className="district-enter">
                  Enter district <Music2 size={14} />
                </span>
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}

export default PracticeSquare
