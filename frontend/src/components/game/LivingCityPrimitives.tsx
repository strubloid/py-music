import React from 'react';
import { AlertTriangle, Gift, Headphones, Map, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import PipCharacter from '../../game/characters/PipCharacter';
import './LivingCityPrimitives.scss';

export const WorldHUD = ({ level = 12, rank = 'Bronze', focus = 7 }) => <header className="primitive-hud" aria-label="Player status"><span><Map /> Practice Square</span><dl><div><dt>Level</dt><dd>{level}</dd></div><div><dt>Rank</dt><dd>{rank}</dd></div></dl><FocusMeter value={focus} /></header>;
export const FocusMeter = ({ value = 7, max = 10 }) => <div className="primitive-focus" role="meter" aria-label="Focus" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span>Focus</span><strong>{value}/{max}</strong><i style={{ '--focus': `${value / max * 100}%` } as React.CSSProperties} /></div>;
export const FocusSpendTrail = () => <div className="primitive-spend" role="status"><Sparkles /><strong>Root Lantern</strong><span>−3 Focus</span><i /><i /><i /></div>;
export const MusicalDie = ({ value = 7 }) => <div className="primitive-die" role="img" aria-label={`${value}-movement musical die`}><span>{value}</span><small>movements</small></div>;
export const TonalCompass = () => <div className="primitive-compass" role="img" aria-label="Tonal compass pointing to D"><i /><span>D</span><small>Dorian pull</small></div>;
export const VaultDoor = () => <button className="primitive-vault" type="button"><Gift /><strong>Weekly Vault</strong><span>2 seals ready</span></button>;
export const MissionObject = () => <article className="primitive-mission"><span aria-hidden="true">▰</span><div><small>MISSION SCROLL</small><h3>Cross three Scale Trails</h3><progress value="2" max="3" aria-label="Two of three trails complete" /></div><button type="button">Hand scroll to Pip</button></article>;
export const RewardReveal = () => <section className="primitive-reward" role="dialog" aria-label="Trail reward"><PipCharacter state="success" /><Sparkles /><h2>Landmark awakened</h2><strong>+35 XP · +1 Focus</strong><button type="button">Keep exploring</button></section>;
export const InstructionBanner = () => <aside className="primitive-instruction"><Headphones /><div><small>ECHO CHASE</small><strong>Listen, then chase the matching route.</strong></div></aside>;
export const AccessibleGameControls = () => <nav className="primitive-controls" aria-label="Game controls"><button type="button"><Play /> Play prompt</button><button type="button"><Pause /> Pause</button><button type="button"><RotateCcw /> Replay</button></nav>;
export const LoadingScene = () => <section className="primitive-state" role="status"><PipCharacter state="think" /><span>♪ ♫ ♪</span><h2>Pip is tuning the Listening Beacon…</h2><p>Checking the city signal before the gates open.</p></section>;
export const ErrorRecovery = () => <section className="primitive-state is-error" role="alert"><AlertTriangle /><h2>Echo lost the sound signal</h2><p>Your progress is safe. Tap the beacon to reconnect.</p><button type="button">Reconnect beacon</button><details><summary>Technical details</summary><code>AUDIO_SIGNAL_TIMEOUT</code></details></section>;
