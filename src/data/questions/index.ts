import type { Question } from '../types';
import { arithmetic } from './arithmetic';
import { algebra } from './algebra';
import { geometry } from './geometry';
import { dataAnalysis } from './data';
import { phase2Questions } from './phase2';
import { bank3Algebra } from './bank3Algebra';
import { bank3Arithmetic } from './bank3Arithmetic';
import { bank3Data } from './bank3Data';
import { bank3Geometry } from './bank3Geometry';
import { qcBank } from './qcBank';
import { diBank } from './diBank';
import { bank4 } from './bank4';
import { B5_ITEMS } from './b5';

export const QUESTIONS: Question[] = [...arithmetic, ...algebra, ...geometry, ...dataAnalysis, ...phase2Questions, ...bank3Arithmetic, ...bank3Algebra, ...bank3Geometry, ...bank3Data, ...qcBank, ...diBank, ...bank4, ...B5_ITEMS.map((i) => i.q)];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
