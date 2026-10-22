import type { DiagramId } from '../data/types';
import { SALES } from '../data/questions/data';

const stroke = { stroke: 'var(--ink)', strokeWidth: 2, fill: 'none' } as const;
const label = { fill: 'var(--ink)', fontSize: 15, fontFamily: 'var(--font-math)' } as const;
const muted = { fill: 'var(--muted)', fontSize: 13 } as const;

function RightAngle({ x, y, size = 12, dir = [1, -1] }: { x: number; y: number; size?: number; dir?: [number, number] }) {
  const [dx, dy] = dir;
  return <path d={`M ${x + dx * size} ${y} L ${x + dx * size} ${y + dy * size} L ${x} ${y + dy * size}`} {...stroke} strokeWidth={1.5} />;
}

function RightTriangle() {
  return (
    <svg viewBox="0 0 260 180" role="img" aria-label="Right triangle with legs 6 and 8 and an unknown hypotenuse">
      <polygon points="40,150 220,150 40,30" {...stroke} />
      <RightAngle x={40} y={150} />
      <text x={22} y={95} {...label}>6</text>
      <text x={125} y={172} {...label}>8</text>
      <text x={138} y={82} {...label}>?</text>
    </svg>
  );
}

function TriangleFiveNine() {
  return (
    <svg viewBox="0 0 280 170" role="img" aria-label="Triangle with two sides labeled 5 and 9 and a third side unknown">
      <polygon points="30,145 250,145 95,35" {...stroke} />
      <text x={48} y={88} {...label}>5</text>
      <text x={178} y={88} {...label}>9</text>
      <text x={135} y={166} {...label}>?</text>
    </svg>
  );
}

function Box() {
  return (
    <svg viewBox="0 0 280 210" role="img" aria-label="Rectangular box 3 by 4 by 12 with a dashed diagonal between opposite corners">
      <polygon points="40,180 190,180 240,150 90,150" {...stroke} />
      <polygon points="40,180 40,40 190,40 190,180" {...stroke} />
      <polyline points="190,40 240,10 240,150" {...stroke} />
      <line x1={40} y1={40} x2={90} y2={10} {...stroke} />
      <line x1={90} y1={10} x2={240} y2={10} {...stroke} />
      <line x1={90} y1={10} x2={90} y2={150} {...stroke} strokeDasharray="4 4" strokeWidth={1.2} />
      <line x1={40} y1={180} x2={240} y2={10} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" />
      <text x={108} y={200} {...label}>4</text>
      <text x={222} y={178} {...label}>3</text>
      <text x={16} y={115} {...label}>12</text>
      <text x={150} y={92} fill="var(--accent)" fontSize={15}>d</text>
    </svg>
  );
}

function SimilarTriangles() {
  return (
    <svg viewBox="0 0 320 170" role="img" aria-label="Small triangle ABC and larger similar triangle DEF">
      <polygon points="20,140 100,140 40,80" {...stroke} />
      <text x={6} y={156} {...label}>A</text>
      <text x={102} y={156} {...label}>B</text>
      <text x={32} y={72} {...label}>C</text>
      <text x={55} y={158} {...muted}>4</text>
      <text x={76} y={104} {...muted}>6</text>
      <polygon points="130,150 310,150 175,15" {...stroke} />
      <text x={116} y={166} {...label}>D</text>
      <text x={302} y={166} {...label}>E</text>
      <text x={168} y={12} {...label}>F</text>
      <text x={212} y={168} {...muted}>10</text>
      <text x={252} y={80} {...muted}>?</text>
    </svg>
  );
}

function SquareDiagonal() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Square with a diagonal of length 6 root 2">
      <rect x={30} y={30} width={140} height={140} {...stroke} />
      <line x1={30} y1={170} x2={170} y2={30} {...stroke} stroke="var(--accent)" />
      <text x={70} y={92} fill="var(--accent)" fontSize={15}>6√2</text>
    </svg>
  );
}

function Circle() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Circle with center O and radius r">
      <circle cx={100} cy={100} r={70} {...stroke} />
      <circle cx={100} cy={100} r={3} fill="var(--ink)" />
      <line x1={100} y1={100} x2={170} y2={100} {...stroke} strokeDasharray="5 4" />
      <text x={128} y={94} {...label}>r</text>
      <text x={86} y={118} {...muted}>O</text>
    </svg>
  );
}

function SalesChart() {
  const max = 160;
  const h = 160;
  const barW = 44;
  return (
    <svg viewBox="0 0 320 230" role="img" aria-label={`Bar chart of quarterly sales: ${SALES.map((s) => `${s.label} ${s.value}`).join(', ')} thousand dollars`}>
      <text x={8} y={14} {...muted}>Sales (thousands of $)</text>
      {[0, 40, 80, 120, 160].map((v) => {
        const y = 190 - (v / max) * h;
        return (
          <g key={v}>
            <line x1={44} x2={310} y1={y} y2={y} stroke="var(--grid)" strokeWidth={1} />
            <text x={36} y={y + 4} textAnchor="end" {...muted}>{v}</text>
          </g>
        );
      })}
      {SALES.map((s, i) => {
        const x = 64 + i * 62;
        const bh = (s.value / max) * h;
        return (
          <g key={s.label}>
            <rect x={x} y={190 - bh} width={barW} height={bh} fill="var(--accent)" rx={3} />
            <text x={x + barW / 2} y={184 - bh} textAnchor="middle" fill="var(--ink)" fontSize={12}>{s.value}</text>
            <text x={x + barW / 2} y={208} textAnchor="middle" {...muted}>{s.label}</text>
          </g>
        );
      })}
      <line x1={44} x2={310} y1={190} y2={190} stroke="var(--ink)" strokeWidth={1.5} />
    </svg>
  );
}

const REGISTRY: Record<DiagramId, { el: () => React.JSX.Element; toScale: boolean }> = {
  'right-triangle-6-8': { el: RightTriangle, toScale: false },
  'triangle-5-9': { el: TriangleFiveNine, toScale: false },
  'box-3-4-12': { el: Box, toScale: false },
  'similar-triangles': { el: SimilarTriangles, toScale: false },
  'square-diagonal': { el: SquareDiagonal, toScale: false },
  'circle-circumference': { el: Circle, toScale: false },
  'bar-chart-sales': { el: SalesChart, toScale: true },
};

export function Diagram({ id }: { id: DiagramId }) {
  const { el: El, toScale } = REGISTRY[id];
  return (
    <figure className="diagram">
      <El />
      {!toScale && <figcaption>Note: Figure not necessarily drawn to scale.</figcaption>}
    </figure>
  );
}
