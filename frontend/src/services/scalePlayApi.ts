// Scale Path API calls for the frontend

import api from './api';

export interface ScalePathRunParams {
  root?: string;
  mode?: string;
  octaves?: number;
  difficulty?: number;
}

export const getScalePathRun = (params: ScalePathRunParams = {}) => {
  const qs = new URLSearchParams();
  if (params.root) qs.set('root', params.root);
  if (params.mode) qs.set('mode', params.mode);
  if (params.octaves) qs.set('octaves', String(params.octaves));
  if (params.difficulty) qs.set('difficulty', String(params.difficulty));
  return api.get(`/api/scale-path/run?${qs.toString()}`);
};

export const completeScalePathFragment = (payload: {
  runId: string;
  fragmentIndex: number;
  correct: boolean;
  difficulty: number;
}) => api.post('/api/scale-path/complete', payload);

export const verifyScaleLabBuild = (payload: {
  root: string;
  mode: string;
  selectedNotes: number[];
}) => api.post('/api/scale-path/verify', payload);
