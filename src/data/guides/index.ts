import { geometryBGuides } from './g2/geometryB';
import { dataBGuides } from './g2/dataB';
import { algebraGuides } from './algebra';
import { arithDataGuides } from './arithData';
import { geometryGuides } from './geometry';
import type { Guide } from './types';
import { algebraAGuides } from './g2/algebraA';
import { arithAGuides } from './g2/arithA';

export type { Guide, GuideStep, GuideTrack } from './types';

export const GUIDES: Guide[] = [...algebraGuides, ...geometryGuides, ...arithDataGuides, ...algebraAGuides, ...arithAGuides, ...dataBGuides, ...geometryBGuides];
export const GUIDE_BY_QID: Record<string, Guide> = Object.fromEntries(GUIDES.map((g) => [g.qid, g]));
