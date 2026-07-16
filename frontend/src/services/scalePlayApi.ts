// Scale Path API calls for the frontend

import api from './api';

export interface ScalePathRunParams {
  root?: string;
  mode?: string;
  octaves?: number;
  difficulty?: number;
  seed?: string;
}

export const getScalePathRun = (params: ScalePathRunParams = {}) => {
  const qs = new URLSearchParams();
  if (params.root) qs.set('root', params.root);
  if (params.mode) qs.set('mode', params.mode);
  if (params.octaves) qs.set('octaves', String(params.octaves));
  if (params.difficulty) qs.set('difficulty', String(params.difficulty));
  if (params.seed) qs.set('seed', params.seed);
  return api.get(`/api/scale-path/run?${qs.toString()}`);
};

export interface CompleteScalePathFragmentPayload {
  runId: string;
  fragmentIndex: number;
  submittedPosition: { string: string; fret: number };
  submittedMidi?: number;
  difficulty: number;
}

export const completeScalePathFragment = (payload: CompleteScalePathFragmentPayload) =>
  api.post('/api/scale-path/complete', payload);

export const verifyScaleLabBuild = (payload: {
  root: string;
  mode: string;
  selectedNotes: number[];
}) => api.post('/api/scale-path/verify', payload);
