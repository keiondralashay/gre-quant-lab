import type { GuideStep } from './types';

/** Compact constructors for guide steps. */
export const ch = (id: string, prompt: string, options: string[], answer: number, hints: string[], explain: string): GuideStep => ({ id, kind: 'choice', prompt, options, answer, hints, explain });
export const num = (id: string, prompt: string, answer: string, hints: string[], explain: string): GuideStep => ({ id, kind: 'number', prompt, answer, hints, explain });
export const fields = (id: string, prompt: string, fs: [string, string, string][], hints: string[], explain: string): GuideStep => ({
  id,
  kind: 'fields',
  prompt,
  fields: fs.map(([fid, label, answer]) => ({ id: fid, label, answer })),
  hints,
  explain,
});
