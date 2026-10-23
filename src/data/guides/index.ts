import { algebraGuides } from './algebra';
import { arithDataGuides } from './arithData';
import { geometryGuides } from './geometry';
import type { Guide } from './types';

export type { Guide, GuideStep, GuideTrack } from './types';

export const GUIDES: Guide[] = [...algebraGuides, ...geometryGuides, ...arithDataGuides];
export const GUIDE_BY_QID: Record<string, Guide> = Object.fromEntries(GUIDES.map((g) => [g.qid, g]));
