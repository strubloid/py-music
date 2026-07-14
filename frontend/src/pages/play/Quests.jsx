import React, { useMemo, useState } from 'react';
import { BatteryCharging, Check, Clock3, Flame, Sparkles, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '../../contexts/GameProgressContext.jsx';
import {
  getQuestPeriodKey,
  getQuestProgress,
  selectQuestBoard,
} from '../../game/questSystem.js';
import './Quests.css';

const CADENCES = [
  { id: 'daily', label: 'Daily', icon: Clock3 },
  { id: 'weekly', label: 'Weekly', icon: Flame },
  { id: 'milestone', label: 'Milestones', icon: Trophy },
];

const REWARD_POOLS = { daily: 100, weekly: 700, milestone: 10000 };
const getMissionRoute = (quest) => quest.metric === 'daily-wins' ? '/play/daily' : '/play/ear-training';

const Quests = () => {
  const { progressState, claimQuest, rankMeta } = useGameProgress();
  const navigate = useNavigate();
  const [cadence, setCadence] = useState('daily');
  const [claiming, setClaiming] = useState(null);
  const [message, setMessage] = useState('');
  const now = new Date();
  const quests = useMemo(() => selectQuestBoard(now), []);
  const visibleQuests = quests.filter((quest) => quest.cadence === cadence);
  const completed = quests.filter((quest) => {
    const periodKey = getQuestPeriodKey(quest, now);
    return Boolean(progressState.questClaims?.[`${quest.id}:${periodKey}`]);
  }).length;
  const activeMission = visibleQuests.find((quest) => getQuestProgress(quest, progressState, now) < quest.target) || visibleQuests[0];
  const activeMissionProgress = activeMission
    ? Math.min(activeMission.target, getQuestProgress(activeMission, progressState, now))
    : 0;

  const handleClaim = async (quest) => {
    const periodKey = getQuestPeriodKey(quest, now);
    setClaiming(quest.id);
    setMessage('');
    try {
      const reward = await claimQuest(quest, periodKey);
      if (reward.alreadyClaimed) setMessage('That reward is already safely in your collection.');
      else setMessage(`Quest cleared: +${reward.xpAwarded} XP${reward.focusRestored ? ` and +${reward.focusRestored} Focus` : ''}.`);
    } catch {
      setMessage('The quest was completed, but the reward could not be claimed yet.');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <main className="quest-room">
      <header className="quest-hero">
        <div className="quest-hero-copy">
          <span className="quest-kicker"><Sparkles size={15} /> Practice missions</span>
          <h1>Quest Board</h1>
          <p>Small musical missions refill Focus for powers and nudge your rank journey forward without replacing real practice.</p>
          {activeMission && (
            <div className="quest-now-playing">
              <div><span>Active mission</span><strong>{activeMission.title}</strong><small>{activeMissionProgress}/{activeMission.target} complete</small></div>
              <button type="button" onClick={() => navigate(getMissionRoute(activeMission))}>Launch mission</button>
            </div>
          )}
        </div>
        <div className="quest-hero-meters">
          <div className="quest-room-meter" aria-label={rankMeta.progressLabel}>
            <Trophy size={24} />
            <div><strong>{rankMeta.name}</strong><span>Level {rankMeta.level} of {rankMeta.levels}</span></div>
          </div>
          <div className="quest-room-meter" aria-label={`${progressState.focusPoints} focus available`}>
            <BatteryCharging size={24} />
            <div><strong>{progressState.focusPoints}/5</strong><span>Focus bank</span></div>
          </div>
        </div>
      </header>

      <section className="quest-summary" aria-label="Quest summary">
        <div><strong>{quests.length}</strong><span>quests in rotation</span></div>
        <div><strong>{completed}</strong><span>rewards claimed</span></div>
        <div><strong>{progressState.totalCompleted}</strong><span>moves recorded</span></div>
      </section>

      <nav className="quest-tabs" aria-label="Quest periods">
        {CADENCES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={cadence === id ? 'is-active' : ''} onClick={() => setCadence(id)}>
            <Icon size={16} /> {label}
            <span>{quests.filter((quest) => quest.cadence === id).length} · {REWARD_POOLS[id].toLocaleString()} XP</span>
          </button>
        ))}
      </nav>

      {message && <p className="quest-toast" role="status">{message}</p>}

      <section className="quest-grid" aria-label={`${cadence} quests`}>
        {visibleQuests.map((quest, index) => {
          const current = Math.min(quest.target, getQuestProgress(quest, progressState, now));
          const complete = current >= quest.target;
          const periodKey = getQuestPeriodKey(quest, now);
          const claimKey = `${quest.id}:${periodKey}`;
          const claimed = Boolean(progressState.questClaims?.[claimKey]);
          const canClaim = complete && !claimed;
          const percent = Math.round((current / quest.target) * 100);
          return (
            <article className={`quest-card quest-card--${cadence} ${complete ? 'is-complete' : ''} ${claimed ? 'is-claimed' : ''}`} key={quest.id}>
              <div className="quest-card-top">
                <span className="quest-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="quest-reward">+{quest.xp} XP {quest.focus ? `· +${quest.focus} Focus` : ''}</span>
              </div>
              <Target className="quest-target" size={24} aria-hidden="true" />
              <h2>{quest.title}</h2>
              <p>{quest.description}</p>
              <div className="quest-progress-copy"><span>{current} / {quest.target}</span><span>{percent}%</span></div>
              <div className="quest-progress-track"><span style={{ width: `${percent}%` }} /></div>
              <button type="button" className="quest-card-action" disabled={claimed || claiming === quest.id} onClick={() => (canClaim ? handleClaim(quest) : navigate(getMissionRoute(quest)))}>
                {claimed ? <><Check size={15} /> Claimed</> : canClaim ? 'Claim reward' : 'Launch mission'}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default Quests;
