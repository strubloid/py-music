import React from 'react';
import { Gauge, Headphones, HelpCircle, Shield, Sparkles } from 'lucide-react';

const iconFor = (id) => (id.includes('combo') || id === 'second_chance' ? Shield : id === 'slow_down' ? Gauge : id === 'compare_mode' ? Sparkles : HelpCircle);

const AbilityDock = ({ powers, game, focus, instrument, instruments, audioState, onInstrumentChange, onUsePower }) => (
  <section className="ability-dock" aria-label="Listening abilities">
    <label className="ability-dock__instrument"><Headphones /><span><small>Instrument</small><select aria-label="Playback instrument" value={instrument} onChange={(event) => onInstrumentChange(event.target.value)} disabled={game.phase === 'playing-prompt'}>{instruments.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></span><em>{audioState.loadingInstrumentId ? 'Loading samples' : 'Balanced voicing'}</em></label>
    <div className="ability-dock__powers">
      {powers.map((power) => {
        const Icon = iconFor(power.id);
        const used = game.usedPowers.includes(power.id);
        return <button type="button" key={power.id} className={used ? 'ability-tile ability-tile--used' : 'ability-tile'} onClick={() => onUsePower(power.id)} disabled={game.phase !== 'accepting-input' || used} aria-pressed={used} title={power.description || power.name}><Icon /><span>{power.name}</span><small>{power.focusCost ? `${power.focusCost} focus` : power.xpPenalty ? `−${power.xpPenalty} XP` : 'aid'}</small></button>;
      })}
    </div>
    <div className="focus-crystal"><span>Focus</span><strong>{focus}</strong></div>
  </section>
);

export default React.memo(AbilityDock);
