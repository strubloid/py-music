import React from 'react';

export type PipState = 'idle' | 'curious' | 'walk' | 'listen' | 'think' | 'success' | 'recovery' | 'exhausted' | 'sleep';

type PipCharacterProps = { state?: PipState; className?: string; riveSrc?: string };

const RivePip = React.lazy(() => import('./RivePip'));

const PipFallback = ({ state = 'idle', className = '' }: PipCharacterProps) => (
  <svg className={className} viewBox="0 0 180 220" role="img" aria-label={`Pip is ${state}`} data-pip-state={state}>
    <defs>
      <linearGradient id="pip-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFE06A"/><stop offset="1" stopColor="#FF9F1C"/></linearGradient>
      <filter id="pip-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="88" cy="202" rx="54" ry="10" fill="#050816" opacity=".55"/>
    <path d="M118 50V8h13v74" fill="url(#pip-gold)" stroke="#070A18" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M128 13c22-2 33 7 35 22-13-8-25-7-35-2z" fill="#FFC21C" stroke="#070A18" strokeWidth="5"/>
    <path d="M55 80c13-25 58-32 77-7 18 24 9 70-18 85-28 15-67 0-73-31-3-16 2-34 14-47z" fill="url(#pip-gold)" stroke="#070A18" strokeWidth="7" filter="url(#pip-glow)"/>
    <path d="M44 105 18 119M132 104l28 13" stroke="#FFC21C" strokeWidth="9" strokeLinecap="round"/>
    <circle cx="74" cy="104" r="6" fill="#070A18"/><circle cx="105" cy="104" r="6" fill="#070A18"/>
    <path d={state === 'success' ? 'M72 124q18 22 36 0' : state === 'exhausted' ? 'M72 137q18-18 36 0' : 'M76 130q14 12 28 0'} fill="none" stroke="#070A18" strokeWidth="6" strokeLinecap="round"/>
    <path d="M69 158 58 193M112 158l14 35" stroke="#FFC21C" strokeWidth="11" strokeLinecap="round"/>
    <path d="M42 194h28M116 194h31" stroke="#42D8FF" strokeWidth="13" strokeLinecap="round"/>
    <path d="M121 86h24v58h-25" fill="#26205E" stroke="#070A18" strokeWidth="5"/>
  </svg>
);

const PipCharacter = ({ riveSrc, ...props }: PipCharacterProps) => riveSrc
  ? <React.Suspense fallback={<PipFallback {...props} />}><RivePip {...props} src={riveSrc} /></React.Suspense>
  : <PipFallback {...props} />;

export default PipCharacter;
