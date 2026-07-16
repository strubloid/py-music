import React from 'react'
import { Flame, HeartPulse, Target, Trophy } from 'lucide-react'

const EarGameHud = ({ challengeIndex, challengeCount, combo, correctCount, score, skill }) => {
  const answered = Math.max(0, challengeIndex)
  const accuracy = answered ? Math.round((correctCount / answered) * 100) : 0
  return (
    <header className="note-runner-hud">
      <div>
        <Target />
        <span>Gate</span>
        <strong>
          {Math.min(challengeIndex + 1, challengeCount)} / {challengeCount}
        </strong>
      </div>
      <div>
        <Flame />
        <span>Combo</span>
        <strong>{combo}x</strong>
      </div>
      <div>
        <HeartPulse />
        <span>Accuracy</span>
        <strong>{accuracy}%</strong>
      </div>
      <div>
        <Trophy />
        <span>Score</span>
        <strong>{score}</strong>
      </div>
      <div className="note-runner-hud__skill">
        <span>Training</span>
        <strong>{skill}</strong>
      </div>
    </header>
  )
}

export default EarGameHud
