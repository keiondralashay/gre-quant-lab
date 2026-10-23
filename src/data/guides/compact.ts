import type { Guide, GuideStep, GuideTrack } from './types';

/**
 * Compact guide authoring. Every guide is still written by hand for its own
 * question; this only shortens the notation.
 *
 *   ['c', id, prompt, options, hints, explain]  choice — options[0] is correct;
 *                                               an option starting with "=" is also accepted (an equally valid choice).
 *   ['n', id, prompt, answer, hints, explain]   number — any equivalent value is accepted (6/4 = 3/2 = 1.5)
 *   ['f', id, prompt, [[fid, label, answer]...], hints, explain]   several boxes
 *
 * A track is [label, operationStep, ...nextSteps]. `given` options starting with
 * "+" are the ones actually given.
 */
export type CStep =
  | ['c', string, string, string[], string | string[], string]
  | ['n', string, string, string, string | string[], string]
  | ['f', string, string, [string, string, string][], string | string[], string];

export type CTrack = [string, CStep, ...CStep[]];

export interface CGuide {
  qid: string;
  given: string[];
  gx: string;
  c: CStep;
  f: CTrack;
  l?: CTrack;
}

const hintList = (h: string | string[]) => (Array.isArray(h) ? h : [h]);

export function step(s: CStep): GuideStep {
  if (s[0] === 'c') {
    const accept = s[3].map((o, i) => (i > 0 && o.startsWith('=') ? i : -1)).filter((i) => i > 0);
    return { id: s[1], kind: 'choice', prompt: s[2], options: s[3].map((o) => (o.startsWith('=') ? o.slice(1) : o)), answer: 0, accept: accept.length ? accept : undefined, hints: hintList(s[4]), explain: s[5] };
  }
  if (s[0] === 'n') return { id: s[1], kind: 'number', prompt: s[2], answer: s[3], hints: hintList(s[4]), explain: s[5] };
  return { id: s[1], kind: 'fields', prompt: s[2], fields: s[3].map(([id, label, answer]) => ({ id, label, answer })), hints: hintList(s[4]), explain: s[5] };
}

const track = ([label, op, ...next]: CTrack): GuideTrack => ({ label, operation: step(op), next: next.map(step) });

export function guide(g: CGuide): Guide {
  return {
    qid: g.qid,
    given: { options: g.given.map((o) => o.replace(/^\+/, '')), correct: g.given.map((o, i) => (o.startsWith('+') ? i : -1)).filter((i) => i >= 0), explain: g.gx },
    components: step(g.c),
    fast: track(g.f),
    long: g.l ? track(g.l) : undefined,
  };
}
