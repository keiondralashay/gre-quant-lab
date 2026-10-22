import { LESSON_BY_ID } from '../data/library';
import { questionsForLesson } from '../data/links';
import type { ProgressState } from './progress';

export interface LessonStatus {
  visited: boolean;
  checksPassed: number;
  checksTotal: number;
  bankCorrect: number;
  bankTotal: number;
}

/** Derived only from recorded attempts — never estimated. */
export function lessonStatus(lessonId: string, progress: ProgressState): LessonStatus {
  const lesson = LESSON_BY_ID[lessonId];
  const passed = new Set(
    progress.attempts.filter((a) => a.kind === 'lesson-check' && a.result === 'correct' && a.ref.startsWith(`lesson:${lessonId}:`)).map((a) => a.ref),
  );
  const bank = questionsForLesson(lessonId);
  const correct = new Set(progress.attempts.filter((a) => a.kind === 'answer' && a.result === 'correct' && bank.includes(a.ref)).map((a) => a.ref));
  return {
    visited: (progress.visitedLessons ?? []).includes(lessonId),
    checksPassed: lesson ? lesson.tryIt.filter((e) => passed.has(`lesson:${lessonId}:${e.id}`)).length : 0,
    checksTotal: lesson?.tryIt.length ?? 0,
    bankCorrect: correct.size,
    bankTotal: bank.length,
  };
}

export function statusLabel(s: LessonStatus): { label: string; tone: 'neutral' | 'medium' | 'easy' } {
  if (s.checksTotal && s.checksPassed === s.checksTotal) return { label: 'Checks passed', tone: 'easy' };
  if (s.visited || s.checksPassed || s.bankCorrect) return { label: 'In progress', tone: 'medium' };
  return { label: 'Not started', tone: 'neutral' };
}
