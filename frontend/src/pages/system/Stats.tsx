import React, { useEffect, useMemo, useState } from 'react'
import { BarChart2, Footprints, Medal, RadioTower, Sparkles, Trophy, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getGameProgress, getLeaderboard } from '../../services/api'
import './Stats.scss'

const MILESTONES = [5, 15, 30, 50, 67, 100]

const Stats = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState<any>(null)
  const [leaders, setLeaders] = useState<any[]>([])
  const [myPosition, setMyPosition] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getLeaderboard(12), user ? getGameProgress() : Promise.resolve({ data: null })])
      .then(([leaderboard, gameProgress]) => {
        if (cancelled) return
        setLeaders(leaderboard.data.players || [])
        setMyPosition(leaderboard.data.my_position ?? gameProgress.data?.leaderboard_position ?? null)
        setProgress(gameProgress.data)
      })
      .catch(() => !cancelled && setError('The City signal is quiet. Try this room again soon.'))
    return () => {
      cancelled = true
    }
  }, [user])

  const trailEnd = progress?.next_attempt_milestone || 5
  const previousMilestone = useMemo(() => {
    const attempts = progress?.active_plays || 0
    return (
      [...MILESTONES, ...Array.from({ length: Math.ceil(attempts / 100) }, (_, index) => (index + 2) * 100)]
        .filter((value) => value <= attempts)
        .at(-1) || 0
    )
  }, [progress?.active_plays])
  const trailPercent = Math.min(
    100,
    Math.max(0, ((progress?.active_plays - previousMilestone) / Math.max(1, trailEnd - previousMilestone)) * 100),
  )

  return (
    <div className="stats-page">
      <header className="stats-observatory">
        <span>
          <RadioTower size={16} /> City Observatory
        </span>
        <h1>Progress & Leaderboard</h1>
        <p>Your permanent rank grows with account level. Your leaderboard position moves with lifetime points.</p>
        {user && (
          <div className="observatory-readout">
            <div>
              <strong>Level {user.level || 1}</strong>
              <span>{user.rank?.name || 'Unranked'} forever earned</span>
            </div>
            <div>
              <strong>#{myPosition || '—'}</strong>
              <span>competitive position</span>
            </div>
            <div>
              <strong>{progress?.lifetime_points ?? user.lifetime_points ?? user.xp ?? 0}</strong>
              <span>lifetime points</span>
            </div>
            <div>
              <strong>{progress?.focus_points ?? user.focus_points ?? 0}/10</strong>
              <span>Focus</span>
            </div>
          </div>
        )}
      </header>

      {error && <div className="stats-signal-error">{error}</div>}

      {user ? (
        <section className="attempt-trail" aria-labelledby="attempt-trail-title">
          <div className="section-heading">
            <Footprints />
            <div>
              <span>Persistence, not perfection</span>
              <h2 id="attempt-trail-title">Attempt Trail</h2>
            </div>
            <strong>{progress?.active_plays || 0} active plays</strong>
          </div>
          <div className="trail-track">
            <div className="trail-fill" style={{ width: `${trailPercent}%` }} />
            {[previousMilestone, trailEnd].map((value) => (
              <span key={value} style={{ left: value === previousMilestone ? '0%' : '100%' }}>
                <i>{value}</i>
              </span>
            ))}
            <Footprints className="trail-walker" style={{ left: `${trailPercent}%` }} />
          </div>
          <p>
            Next mystery reward at <strong>{trailEnd}</strong>. Entering active play counts once; opening and leaving a
            page does not.
          </p>
          {progress?.rewards?.length > 0 && (
            <div className="reward-shelf">
              {progress.rewards.map((reward) => (
                <div key={reward.id}>
                  <Sparkles size={15} />
                  <strong>{reward.payload?.name}</strong>
                  <span>{reward.payload?.attempts} plays</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="stats-signin">
          <BarChart2 />
          <p>Sign in to grow an Attempt Trail and hold a leaderboard position.</p>
        </div>
      )}

      <section className="leaderboard-tower" aria-labelledby="leaderboard-title">
        <div className="section-heading">
          <Trophy />
          <div>
            <span>Changes as musicians pass one another</span>
            <h2 id="leaderboard-title">City Signal Board</h2>
          </div>
        </div>
        {leaders.length >= 3 && (
          <div className="leader-podium">
            {[leaders[1], leaders[0], leaders[2]].map((player, index) => (
              <div key={player.username} className={`podium podium-${index}`}>
                <Medal />
                <strong>{player.username}</strong>
                <span>#{player.position}</span>
                <small>
                  {player.points} pts · Level {player.level}
                </small>
              </div>
            ))}
          </div>
        )}
        <ol className="leader-list">
          {leaders.slice(3).map((player) => (
            <li key={player.username} className={player.username === user?.username ? 'is-me' : ''}>
              <span>{player.position}</span>
              <strong>{player.username}</strong>
              <small>
                Level {player.level} · {player.rank}
              </small>
              <b>{player.points} pts</b>
            </li>
          ))}
          {!leaders.length && !error && (
            <li className="leader-loading">
              <Zap /> Tuning the City signal…
            </li>
          )}
        </ol>
      </section>
    </div>
  )
}

export default Stats
