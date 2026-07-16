import React, { useMemo, useState } from 'react';
import { ArrowLeft, BatteryCharging, Check, Clock3, Flame, KeyRound, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '../../contexts/GameProgressContext';
import { getQuestPeriodKey, getQuestProgress, selectQuestBoard } from '../../game/questSystem';
import './Quests.scss';
import './QuestVaults.scss';

const VAULTS = [
  { id: 'daily', label: 'Daily Vault', Icon: Clock3, reward: 100, reset: 'Resets at local midnight', object: 'Practice capsule' },
  { id: 'weekly', label: 'Weekly Vault', Icon: Flame, reward: 700, reset: 'Resets each Monday', object: 'Story chest' },
  { id: 'milestone', label: 'Milestone Vault', Icon: Trophy, reward: 10000, reset: 'Permanent city legacy', object: 'District relic' },
];
const OBJECT_TYPES = ['scroll', 'chest', 'medal', 'cylinder', 'case'];

const getMissionRoute = (quest) => {
  if (quest.metric === 'daily-wins') return '/play/daily';
  if (quest.title.toLowerCase().includes('scale')) return '/play/scales';
  return '/play/ear-training';
};

const Quests = () => {
  const { progressState, claimQuest, rankMeta, showCityReward } = useGameProgress();
  const navigate = useNavigate();
  const [openVault, setOpenVault] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [message, setMessage] = useState('');
  const now = useMemo(() => new Date(), []);
  const quests = useMemo(() => selectQuestBoard(now), [now]);

  const questState = (quest) => {
    const current = Math.min(quest.target, getQuestProgress(quest, progressState, now));
    const periodKey = getQuestPeriodKey(quest, now);
    const claimed = Boolean(progressState.questClaims?.[`${quest.id}:${periodKey}`]);
    return { current, periodKey, claimed, complete: current >= quest.target };
  };

  const vaultSummaries = VAULTS.map((vault) => {
    const missions = quests.filter((quest) => quest.cadence === vault.id);
    const states = missions.map((quest) => ({ quest, ...questState(quest) }));
    const ready = states.filter((item) => item.complete && !item.claimed).length;
    const resolved = states.filter((item) => item.complete || item.claimed).length;
    const featured = states.find((item) => !item.claimed) || states[0];
    return { ...vault, missions, states, ready, resolved, featured };
  });
  const selectedVault = vaultSummaries.find((vault) => vault.id === openVault);

  const handleClaim = async (quest) => {
    const { periodKey } = questState(quest);
    setClaiming(quest.id);
    setMessage('Vault Keeper is releasing the mission seals…');
    try {
      const reward = await claimQuest(quest, periodKey);
      if (reward.alreadyClaimed) {
        setMessage('That reward is already stamped into your collection.');
      } else {
        setMessage(`Seals released: +${reward.xpAwarded} XP${reward.focusRestored ? ` and +${reward.focusRestored} Focus` : ''}.`);
        showCityReward({
          id: `quest-${quest.id}-${periodKey}`,
          type: 'quest-vault',
          payload: {
            name: quest.title,
            xp: reward.xpAwarded,
            focus: reward.focusRestored,
            message: 'Vault Keeper transferred the reward into your city inventory.',
          },
        });
      }
    } catch {
      setMessage('The mission is complete, but its mechanism could not open yet.');
    } finally {
      setClaiming(null);
    }
  };

  if (!selectedVault) {
    return (
      <main className="quest-vaults quest-vaults--chamber">
        <header className="vault-chamber__header">
          <span><Sparkles size={15} /> QUEST VAULTS</span>
          <h1>The Resonance Chamber</h1>
          <p>Three mechanisms hold the City's practice missions. Choose one vault door; completed energy flows toward its reward object.</p>
          <div className="vault-chamber__meters">
            <span><Trophy /> {rankMeta.name} · Level {rankMeta.accountLevel}</span>
            <span><BatteryCharging /> {progressState.focusPoints}/10 Focus</span>
          </div>
        </header>

        <section className="vault-chamber" aria-label="Quest vault chamber">
          <div className="vault-chamber__rings" aria-hidden="true"><i /><i /><i /></div>
          <div className="vault-keeper" aria-label="Vault Keeper watches the chamber"><span>⌁</span><b>VAULT<br />KEEPER</b></div>
          <div className="vault-pip" aria-label="Pip waits at the centre of the chamber"><i>♪</i><span>Pip</span></div>
          <div className="vault-energy" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="vault-door-row">
            {vaultSummaries.map((vault) => {
              const percent = Math.round((vault.resolved / vault.missions.length) * 100);
              return (
                <button
                  type="button"
                  className={`vault-door vault-door--${vault.id} ${vault.ready ? 'is-ready' : ''}`}
                  key={vault.id}
                  onClick={() => setOpenVault(vault.id)}
                  aria-label={`Open ${vault.label}. ${vault.ready} rewards ready to claim.`}
                >
                  <span className="vault-door__arch"><vault.Icon /><i style={{ '--vault-progress': `${percent * 3.6}deg` }} /><b>{percent}%</b></span>
                  <strong>{vault.label}</strong>
                  <span>{vault.ready ? `${vault.ready} ready to claim` : `${vault.resolved}/${vault.missions.length} resonating`}</span>
                  <small>{vault.featured?.quest.title}</small>
                  <em>{vault.reset}</em>
                  <span className="vault-door__reward" aria-hidden="true">{vault.object}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`quest-vaults quest-vaults--interior quest-vaults--${selectedVault.id}`}>
      <header className="vault-interior__header">
        <button type="button" onClick={() => setOpenVault(null)}><ArrowLeft /> Return to chamber</button>
        <div><span>{selectedVault.reset}</span><h1>{selectedVault.label}</h1><p>{selectedVault.missions.length} mission objects · {selectedVault.reward.toLocaleString()} XP in the full vault</p></div>
        <selectedVault.Icon aria-hidden="true" />
      </header>
      {message && <p className="vault-message" role="status">{message}</p>}
      <section className="mission-vault" aria-label={`${selectedVault.label} mission objects`}>
        <div className="mission-vault__rail" aria-hidden="true" />
        {selectedVault.states.map(({ quest, current, periodKey, claimed, complete }, index) => {
          const canClaim = complete && !claimed;
          const percent = Math.round((current / quest.target) * 100);
          const sealCount = Math.max(1, Math.min(8, quest.target));
          const litSeals = Math.round((percent / 100) * sealCount);
          const objectType = OBJECT_TYPES[index % OBJECT_TYPES.length];
          return (
            <article className={`mission-object mission-object--${objectType} ${canClaim ? 'is-ready' : ''} ${claimed ? 'is-claimed' : ''}`} key={quest.id}>
              <div className="mission-object__artifact" aria-hidden="true"><i /><span>{String(index + 1).padStart(2, '0')}</span></div>
              <div className="mission-object__copy">
                <span className="mission-object__reward">+{quest.xp} XP {quest.focus ? `· +${quest.focus} Focus` : ''}</span>
                <h2>{quest.title}</h2><p>{quest.description}</p>
                <div className="mission-seals" aria-label={`${current} of ${quest.target} complete`}>
                  {Array.from({ length: sealCount }, (_, seal) => <i className={seal < litSeals ? 'is-lit' : ''} key={seal} />)}
                  <strong>{current}/{quest.target}</strong>
                </div>
                <button
                  type="button"
                  disabled={claimed || claiming === quest.id}
                  aria-label={canClaim ? `Claim reward: ${quest.title}` : claimed ? `Claimed: ${quest.title}` : `Launch mission: ${quest.title}`}
                  onClick={() => (canClaim ? handleClaim(quest) : navigate(getMissionRoute(quest)))}
                >
                  {claimed ? <><Check /> Stamped complete</> : canClaim ? <><KeyRound /> Release seals</> : <>Hand mission to Pip</>}
                </button>
                <small className="mission-object__period">{periodKey}</small>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default Quests;