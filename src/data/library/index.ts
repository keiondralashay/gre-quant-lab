import type { Area } from '../types';
import { algebraLessons } from './algebra';
import { arithmeticLessons } from './arithmetic';
import { dataLessons } from './data';
import { geometryLessons } from './geometry';
import type { Lesson } from './types';

export type { Lesson } from './types';

export const LESSONS: Lesson[] = [...arithmeticLessons, ...algebraLessons, ...geometryLessons, ...dataLessons];

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const LESSONS_BY_AREA: Record<Area, Lesson[]> = {
  arithmetic: arithmeticLessons,
  algebra: algebraLessons,
  geometry: geometryLessons,
  data: dataLessons,
};
