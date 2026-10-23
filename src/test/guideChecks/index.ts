import { GEOMETRY_B } from './geometryB';
import { DATA_B } from './dataB';
import { ALGEBRA_A } from './algebraA';
import { ARITH_A } from './arithA';
import type { StepChecks } from './types';

export const GUIDE_CHECKS: StepChecks = { ...ALGEBRA_A, ...ARITH_A, ...DATA_B, ...GEOMETRY_B };
