export type PerformanceProfile = 'high' | 'balanced' | 'low';
export type MotionProfile = 'full' | 'comfort' | 'minimal';

export const PERFORMANCE_PROFILE_KEY = 'strubloid:performance-profile';
export const MOTION_PROFILE_KEY = 'strubloid:motion-profile';

const memoryInGb = () => Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4);
const cores = () => navigator.hardwareConcurrency || 4;

export const detectPerformanceProfile = (): PerformanceProfile => {
  if (typeof navigator === 'undefined') return 'balanced';
  if (memoryInGb() <= 2 || cores() <= 2) return 'low';
  if (memoryInGb() >= 8 && cores() >= 8) return 'high';
  return 'balanced';
};

export const detectMotionProfile = (): MotionProfile => {
  if (typeof window === 'undefined') return 'comfort';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'minimal' : 'full';
};

export const profileBudget = (profile: PerformanceProfile) => ({
  high: { particles: 56, sceneryLayers: 3, npcCount: 3, shadows: true },
  balanced: { particles: 28, sceneryLayers: 2, npcCount: 2, shadows: true },
  low: { particles: 10, sceneryLayers: 1, npcCount: 1, shadows: false },
}[profile]);
