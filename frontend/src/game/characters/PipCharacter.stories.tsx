import type { Meta, StoryObj } from '@storybook/react';
import PipCharacter from './PipCharacter';

const meta = { title: 'Living City/Pip Character', component: PipCharacter, args: { state: 'idle', className: 'pip-story' }, parameters: { layout: 'centered' } } satisfies Meta<typeof PipCharacter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Idle: Story = {};
export const Listening: Story = { args: { state: 'listen' } };
export const Success: Story = { args: { state: 'success' } };
export const Recovery: Story = { args: { state: 'recovery' } };
export const Exhausted: Story = { args: { state: 'exhausted' } };
