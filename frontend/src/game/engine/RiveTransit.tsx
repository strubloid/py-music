import React from 'react';
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas';
import { useMotionProfile } from '../../contexts/MotionContext';

const RiveTransit = ({ className = '' }: { className?: string }) => {
  const { motion, performance } = useMotionProfile();
  const animated = motion === 'full' && performance === 'high';
  const { RiveComponent } = useRive({
    src: '/assets/rive/city-transit.riv',
    autoplay: animated,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  if (!animated) {
    return <span className={`rive-transit-fallback ${className}`} aria-hidden="true">♪ · ♫ · ♪</span>;
  }

  return <RiveComponent className={`rive-transit ${className}`} aria-label="Animated Music City transit" />;
};

export default RiveTransit;
