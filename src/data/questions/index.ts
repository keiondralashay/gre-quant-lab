import type { Question } from '../types';
import { arithmetic } from './arithmetic';
import { algebra } from './algebra';
import { geometry } from './geometry';
import { dataAnalysis } from './data';
import { phase2Questions } from './phase2';

export const QUESTIONS: Question[] = [...arithmetic, ...algebra, ...geometry, ...dataAnalysis, ...phase2Questions];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
