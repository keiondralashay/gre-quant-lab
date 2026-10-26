import { guide, type CGuide } from '../../guides/compact';
import type { Guide } from '../../guides/types';
import type { Question } from '../../types';
import { build, type Spec } from '../build';

/**
 * Bank expansion 5: each question is written together with its full guide and
 * its lesson links, so new questions never ship without a walkthrough.
 */
export interface Item {
  q: Question;
  g: Guide;
  lessons: string[];
}

export function item(lessons: string[], spec: Spec, g: Omit<CGuide, 'qid'>): Item {
  return { q: build(spec), g: guide({ ...g, qid: spec.id }), lessons };
}
