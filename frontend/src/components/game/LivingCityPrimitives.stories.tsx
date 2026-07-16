import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AnswerGate from '../../features/ear-game/components/AnswerGate';
import '../../features/ear-game/styles/gates.scss';
import GameGuitarFretboard from '../../game/instruments/GameGuitarFretboard';
import GamePianoKeyboard from '../../game/instruments/GamePianoKeyboard';
import {
  AccessibleGameControls,
  ErrorRecovery,
  FocusMeter,
  FocusSpendTrail,
  InstructionBanner,
  LoadingScene,
  MissionObject,
  MusicalDie,
  RewardReveal,
  TonalCompass,
  VaultDoor,
  WorldHUD,
} from './LivingCityPrimitives';

const Harness = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`primitive-stage ${className}`}>{children}</div>;
const meta = { title: 'Living City/Design System', component: Harness, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Harness>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WorldHUDStory: Story = { name: 'WorldHUD', render: () => <Harness><WorldHUD /></Harness> };
export const FocusMeterStory: Story = { name: 'FocusMeter', render: () => <Harness><FocusMeter value={4} /></Harness> };
export const FocusSpendTrailStory: Story = { name: 'FocusSpendTrail', render: () => <Harness><FocusSpendTrail /></Harness> };
export const GateAnswerStory: Story = { name: 'GateAnswer', render: () => <Harness><div role="radiogroup" aria-label="Answer gates" style={{ width: 240 }}><AnswerGate answer={{ id: 'major-third', label: 'Major 3rd', accessibleLabel: 'Major third answer gate', lane: 1 }} phase="accepting-input" selected={false} disabled={false} hidden={false} variant="bridge-builder" onSelect={() => undefined} onCommit={() => undefined} /></div></Harness> };
export const GuitarFretboardStory: Story = { name: 'GuitarFretboard', render: () => <Harness><GameGuitarFretboard activeMidi={[40, 45, 50]} legalMidi={[43, 47, 52]} rootPitchClass={4} showLabels /></Harness> };
export const PianoKeyboardStory: Story = { name: 'PianoKeyboard', render: () => <Harness><GamePianoKeyboard activeMidi={[48, 52, 55]} legalMidi={[50, 53, 57]} rootPitchClass={0} showLabels /></Harness> };
export const MusicalDieStory: Story = { name: 'MusicalDie', render: () => <Harness><MusicalDie /></Harness> };
export const TonalCompassStory: Story = { name: 'TonalCompass', render: () => <Harness><TonalCompass /></Harness> };
export const VaultDoorStory: Story = { name: 'VaultDoor', render: () => <Harness><VaultDoor /></Harness> };
export const MissionObjectStory: Story = { name: 'MissionObject', render: () => <Harness><MissionObject /></Harness> };
export const RewardRevealStory: Story = { name: 'RewardReveal', render: () => <Harness><RewardReveal /></Harness> };
export const InstructionBannerStory: Story = { name: 'InstructionBanner', render: () => <Harness><InstructionBanner /></Harness> };
export const AccessibleGameControlsStory: Story = { name: 'AccessibleGameControls', render: () => <Harness><AccessibleGameControls /></Harness> };
export const LoadingScenesStory: Story = { name: 'Loading scenes', render: () => <Harness><LoadingScene /></Harness> };
export const ErrorRecoveryStory: Story = { name: 'Error recovery', render: () => <Harness><ErrorRecovery /></Harness> };
export const MobileReference: Story = { render: () => <Harness><WorldHUD /><br /><InstructionBanner /><br /><AccessibleGameControls /></Harness>, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const KeyboardFocus: Story = { render: () => <Harness><AccessibleGameControls /></Harness>, play: async ({ canvasElement }) => { (canvasElement.querySelector('button') as HTMLButtonElement | null)?.focus(); } };
export const HighContrast: Story = { render: () => <Harness className="primitive-high-contrast"><InstructionBanner /><br /><MissionObject /></Harness> };
export const ReducedMotion: Story = { render: () => <Harness className="primitive-reduced-motion"><LoadingScene /></Harness> };
