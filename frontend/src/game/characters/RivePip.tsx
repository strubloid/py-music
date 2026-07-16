import React from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import type { PipState } from './PipCharacter';

type RivePipProps = { state?: PipState; className?: string; src: string };

const RivePip = ({ state = 'idle', className, src }: RivePipProps) => {
  const { rive, RiveComponent } = useRive({ src, stateMachines: 'Pip', autoplay: true });
  const stateInput = useStateMachineInput(rive, 'Pip', 'state');

  React.useEffect(() => {
    if (!stateInput) return;
    const values: Record<PipState, number> = { idle: 0, curious: 1, walk: 2, listen: 3, think: 4, success: 5, recovery: 6, exhausted: 7, sleep: 8 };
    stateInput.value = values[state];
  }, [state, stateInput]);

  return <RiveComponent className={className} aria-label={`Pip is ${state}`} role="img" />;
};

export default RivePip;