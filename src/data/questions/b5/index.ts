import { geoB } from './geoB';
import { geoA } from './geoA';
import { algebraLinear } from './algebraLinear';
import { algebraIneq } from './algebraIneq';
import { numberExpB } from './numberExpB';
import { numberExpA } from './numberExpA';
import { algebraQuad } from './algebraQuad';
import type { Item } from './item';

export const B5_ITEMS: Item[] = [...algebraQuad, ...numberExpA, ...numberExpB, ...algebraIneq, ...algebraLinear, ...geoA, ...geoB];
