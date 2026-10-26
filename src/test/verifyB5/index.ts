import { STEPS_LINEAR, VERIFY_LINEAR } from './algebraLinear';
import { STEPS_INEQ, VERIFY_INEQ } from './algebraIneq';
import { STEPS_NUMEXP_B, VERIFY_NUMEXP_B } from './numberExpB';
import { STEPS_NUMEXP_A, VERIFY_NUMEXP_A } from './numberExpA';
import type { StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';
import { STEPS_QUAD, VERIFY_QUAD } from './algebraQuad';

export const VERIFY_B5: Record<string, () => Check> = { ...VERIFY_QUAD, ...VERIFY_NUMEXP_A, ...VERIFY_NUMEXP_B, ...VERIFY_INEQ, ...VERIFY_LINEAR };
export const STEPS_B5: StepChecks = { ...STEPS_QUAD, ...STEPS_NUMEXP_A, ...STEPS_NUMEXP_B, ...STEPS_INEQ, ...STEPS_LINEAR };
