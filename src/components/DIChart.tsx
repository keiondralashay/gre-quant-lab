import { useId, useState } from 'react';
import type { DIChart as Chart } from '../data/diSets';

/**
 * Data display for a Data Interpretation set. Every mark is labeled with its
 * value (as on the GRE), identity never depends on color alone, each mark can
 * be hovered or focused for a readout, and a table view is always available.
 */
const W = 560;
const H = 260;
const PAD = { l: 48, r: 24, t: 16, b: 40 };
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

const niceMax = (v: number) => {
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil((v * 1.1) / step) * step;
};

export function DIChart({ chart }: { chart: Chart }) {
  const [table, setTable] = useState(chart.kind === 'table');
  const [active, setActive] = useState<string | null>(null);
  const titleId = useId();
  const mark = (label: string) => ({
    tabIndex: 0,
    role: 'img' as const,
    'aria-label': label,
    onMouseEnter: () => setActive(label),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(label),
    onBlur: () => setActive(null),
  });

  return (
    <figure className="chart di-chart" aria-labelledby={titleId}>
      <figcaption id={titleId} className="chart-title">
        {chart.title}
      </figcaption>
      {chart.kind !== 'table' && (
        <div className="chart-tools">
          <button className="btn-link" aria-pressed={table} onClick={() => setTable((t) => !t)}>
            {table ? 'Show chart' : 'Show as table'}
          </button>
          <span className="chart-readout" aria-live="polite">
            {active ?? ''}
          </span>
        </div>
      )}
      {table || chart.kind === 'table' ? <DataTable chart={chart} /> : null}
      {!table && chart.kind === 'bar' && <Bars chart={chart} mark={mark} />}
      {!table && chart.kind === 'line' && <Lines chart={chart} mark={mark} />}
      {!table && chart.kind === 'pie' && <Pie chart={chart} mark={mark} />}
      {!table && chart.kind === 'scatter' && <Scatter chart={chart} mark={mark} />}
      {chart.kind === 'pie' && <p className="note">{chart.totalLabel}</p>}
    </figure>
  );
}

type Mark = (label: string) => object;

function Grid({ max, fmt = String }: { max: number; fmt?: (v: number) => string }) {
  return (
    <g className="grid" aria-hidden="true">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.t + (1 - f) * plotH;
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" className="axis-text">
              {fmt(Math.round(f * max * 100) / 100)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Bars({ chart, mark }: { chart: Extract<Chart, { kind: 'bar' }>; mark: Mark }) {
  const max = niceMax(Math.max(...chart.bars.map((b) => b.value)));
  const slot = plotW / chart.bars.length;
  const bw = Math.min(56, slot * 0.6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="group" aria-label={`${chart.title}. Bar chart.`}>
      <Grid max={max} />
      {chart.bars.map((b, i) => {
        const h = (b.value / max) * plotH;
        const x = PAD.l + i * slot + (slot - bw) / 2;
        const y = PAD.t + plotH - h;
        return (
          <g key={b.label} className="di-mark" {...mark(`${b.label}: ${b.value} ${chart.unit}`)}>
            <rect x={x - 4} y={PAD.t} width={bw + 8} height={plotH} fill="transparent" />
            <path className="di-bar" d={`M${x},${PAD.t + plotH} V${y + 4} q0,-4 4,-4 H${x + bw - 4} q4,0 4,4 V${PAD.t + plotH} Z`} />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="value-text">
              {b.value}
            </text>
            <text x={x + bw / 2} y={H - PAD.b + 16} textAnchor="middle" className="axis-text">
              {b.label}
            </text>
          </g>
        );
      })}
      <line className="baseline" x1={PAD.l} x2={W - PAD.r} y1={PAD.t + plotH} y2={PAD.t + plotH} />
    </svg>
  );
}

function Lines({ chart, mark }: { chart: Extract<Chart, { kind: 'line' }>; mark: Mark }) {
  const max = niceMax(Math.max(...chart.series.flatMap((s) => s.values)));
  const n = chart.xLabels.length;
  const sx = (i: number) => PAD.l + (i / (n - 1)) * (plotW - 60);
  const sy = (v: number) => PAD.t + (1 - v / max) * plotH;
  // The higher point at each month is labeled above its marker, the lower one below, so labels never collide.
  const aboveOther = (k: number, i: number) => chart.series.every((o, j) => j === k || chart.series[k].values[i] >= o.values[i]) && (k === 0 || chart.series[0].values[i] !== chart.series[k].values[i]);
  // End labels at least 14px apart.
  const ends = chart.series.map((s, k) => ({ k, y: sy(s.values[n - 1]) + 4 })).sort((a, b) => a.y - b.y);
  for (let j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 14) ends[j].y = ends[j - 1].y + 14;
  const endY = Object.fromEntries(ends.map((e) => [e.k, e.y]));
  return (
    <>
      <ul className="legend" aria-label="Legend">
        {chart.series.map((s, k) => (
          <li key={s.label}>
            <span className={`swatch slot-${k + 1}`} aria-hidden="true" /> {s.label}
            <span className="note"> ({k === 0 ? 'circles' : 'squares'})</span>
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="group" aria-label={`${chart.title}. Line graph.`}>
        <Grid max={max} />
        {chart.xLabels.map((l, i) => (
          <text key={l} x={sx(i)} y={H - PAD.b + 16} textAnchor="middle" className="axis-text">
            {l}
          </text>
        ))}
        {chart.series.map((s, k) => (
          <g key={s.label} className={`series slot-${k + 1}`}>
            <polyline points={s.values.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')} fill="none" />
            {s.values.map((v, i) => (
              <g key={i} className="di-mark" {...mark(`${s.label}, ${chart.xLabels[i]}: ${v} ${chart.unit}`)}>
                <circle cx={sx(i)} cy={sy(v)} r={12} fill="transparent" />
                {k === 0 ? <circle className="di-dot" cx={sx(i)} cy={sy(v)} r={5} /> : <rect className="di-dot" x={sx(i) - 4.5} y={sy(v) - 4.5} width={9} height={9} />}
                <text x={sx(i)} y={aboveOther(k, i) ? sy(v) - 10 : sy(v) + 20} textAnchor="middle" className="value-text">
                  {v}
                </text>
              </g>
            ))}
            <text x={sx(n - 1) + 12} y={endY[k]} className="end-label">
              {s.label}
            </text>
          </g>
        ))}
        <line className="baseline" x1={PAD.l} x2={W - PAD.r} y1={PAD.t + plotH} y2={PAD.t + plotH} />
      </svg>
    </>
  );
}

function Pie({ chart, mark }: { chart: Extract<Chart, { kind: 'pie' }>; mark: Mark }) {
  const PW = 420;
  const PH = 270;
  const cx = PW / 2;
  const cy = PH / 2;
  const R = 100;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className="chart-svg di-pie" role="group" aria-label={`${chart.title}. Circle graph.`}>
      {chart.slices.map((s, k) => {
        const a0 = (acc / 100) * 2 * Math.PI - Math.PI / 2;
        acc += s.pct;
        const a1 = (acc / 100) * 2 * Math.PI - Math.PI / 2;
        const mid = (a0 + a1) / 2;
        const large = s.pct > 50 ? 1 : 0;
        const p = (a: number, r = R) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        const lx = cx + (R + 18) * Math.cos(mid);
        const ly = cy + (R + 18) * Math.sin(mid);
        return (
          <g key={s.label} className="di-mark" {...mark(`${s.label}: ${s.pct}%`)}>
            <path className={`di-slice slot-${k + 1}`} d={`M${cx},${cy} L${p(a0)} A${R},${R} 0 ${large} 1 ${p(a1)} Z`} />
            <text x={lx} y={ly + 4} textAnchor={Math.cos(mid) >= 0 ? 'start' : 'end'} className="value-text">
              {s.label} {s.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Scatter({ chart, mark }: { chart: Extract<Chart, { kind: 'scatter' }>; mark: Mark }) {
  const xMax = Math.ceil(Math.max(...chart.points.map((p) => p[0])) + 1);
  const yMin = 50;
  const yMax = 100;
  const sx = (x: number) => PAD.l + (x / xMax) * plotW;
  const sy = (y: number) => PAD.t + (1 - (y - yMin) / (yMax - yMin)) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="chart-svg" role="group" aria-label={`${chart.title}. Scatterplot.`}>
      <g className="grid" aria-hidden="true">
        {[50, 60, 70, 80, 90, 100].map((y) => (
          <g key={y}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} />
            <text x={PAD.l - 6} y={sy(y) + 4} textAnchor="end" className="axis-text">
              {y}
            </text>
          </g>
        ))}
        {Array.from({ length: xMax + 1 }, (_, x) => (
          <text key={x} x={sx(x)} y={H - PAD.b + 16} textAnchor="middle" className="axis-text">
            {x}
          </text>
        ))}
      </g>
      <text x={PAD.l + plotW / 2} y={H - 4} textAnchor="middle" className="axis-title">
        {chart.xLabel}
      </text>
      <text x={14} y={PAD.t + plotH / 2} textAnchor="middle" className="axis-title" transform={`rotate(-90 14 ${PAD.t + plotH / 2})`}>
        {chart.yLabel}
      </text>
      {chart.points.map(([x, y], i) => (
        <g key={i} className="di-mark" {...mark(`${chart.xLabel} ${x}, ${chart.yLabel.toLowerCase()} ${y}`)}>
          <circle cx={sx(x)} cy={sy(y)} r={12} fill="transparent" />
          <circle className="di-dot" cx={sx(x)} cy={sy(y)} r={5} />
        </g>
      ))}
      <line className="baseline" x1={PAD.l} x2={W - PAD.r} y1={PAD.t + plotH} y2={PAD.t + plotH} />
    </svg>
  );
}

function DataTable({ chart }: { chart: Chart }) {
  const head: string[] =
    chart.kind === 'table' ? ['', ...chart.columns] : chart.kind === 'bar' ? ['Department', `Number of ${chart.unit}`] : chart.kind === 'line' ? ['Month', ...chart.series.map((s) => s.label)] : chart.kind === 'pie' ? ['Category', 'Percent', 'Dollars'] : [chart.xLabel, chart.yLabel];
  const rows: (string | number)[][] =
    chart.kind === 'table'
      ? chart.rows.map((r) => [r.label, ...r.values])
      : chart.kind === 'bar'
        ? chart.bars.map((b) => [b.label, b.value])
        : chart.kind === 'line'
          ? chart.xLabels.map((l, i) => [l, ...chart.series.map((s) => s.values[i])])
          : chart.kind === 'pie'
            ? chart.slices.map((s) => [s.label, `${s.pct}%`, `$${((s.pct / 100) * chart.total).toLocaleString()}`])
            : chart.points.map(([x, y]) => [x, y]);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className={chart.kind === 'table' ? '' : 'sr-only'}>
          {chart.title}
          {chart.kind === 'table' && ` (${chart.unit})`}
        </caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
