import { useEffect, useId, useRef, useState } from 'react';
import type { DIChart as Chart } from '../data/diSets';

/**
 * Data display for a Data Interpretation set. Every mark is labeled with its
 * value (as on the GRE), identity never depends on color alone, each mark can
 * be hovered or focused for a readout, and a table view is always available.
 *
 * Charts are drawn at the width they actually occupy (one SVG unit = one CSS
 * pixel), so text stays readable on phones instead of being scaled down.
 */
const MAX_W = 560;
const MIN_W = 260;
const H = 260;
/** Approximate width of one character of 12px chart text. */
const CH = 6.8;

interface Frame {
  W: number;
  H: number;
  PAD: { l: number; r: number; t: number; b: number };
  plotW: number;
  plotH: number;
  narrow: boolean;
}

const frame = (W: number, extraBottom = 0, h = H): Frame => {
  const PAD = { l: 44, r: W < 420 ? 12 : 24, t: 18, b: 40 + extraBottom };
  return { W, H: h + extraBottom, PAD, plotW: W - PAD.l - PAD.r, plotH: h - 18 - 40, narrow: W < 420 };
};

/** Axis maximum with four gridline steps of 1, 2, 2.5, or 5 × 10ⁿ. */
const niceMax = (v: number) => {
  const raw = (v * 1.1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw)!;
  return 4 * step;
};

/** The figure's rendered width, clamped; falls back to the desktop width where layout is unavailable. */
function useWidth() {
  const ref = useRef<HTMLElement>(null);
  const [w, setW] = useState(MAX_W);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const cw = el.clientWidth;
      if (cw > 0) setW(Math.max(MIN_W, Math.min(MAX_W, Math.round(cw))));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function DIChart({ chart }: { chart: Chart }) {
  const [table, setTable] = useState(chart.kind === 'table');
  const [active, setActive] = useState<string | null>(null);
  const [ref, width] = useWidth();
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
    <figure ref={ref} className="chart di-chart" aria-labelledby={titleId}>
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
      {!table && chart.kind === 'bar' && <Bars chart={chart} mark={mark} width={width} />}
      {!table && chart.kind === 'line' && <Lines chart={chart} mark={mark} width={width} />}
      {!table && chart.kind === 'pie' && <Pie chart={chart} mark={mark} />}
      {!table && chart.kind === 'scatter' && <Scatter chart={chart} mark={mark} width={width} />}
      {chart.kind === 'pie' && <p className="note">{chart.totalLabel}</p>}
    </figure>
  );
}

type Mark = (label: string) => object;

function Grid({ f, max, fmt = String }: { f: Frame; max: number; fmt?: (v: number) => string }) {
  return (
    <g className="grid" aria-hidden="true">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = f.PAD.t + (1 - t) * f.plotH;
        return (
          <g key={t}>
            <line x1={f.PAD.l} x2={f.W - f.PAD.r} y1={y} y2={y} />
            <text x={f.PAD.l - 6} y={y + 4} textAnchor="end" className="axis-text">
              {fmt(Math.round(t * max * 100) / 100)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Bars({ chart, mark, width }: { chart: Extract<Chart, { kind: 'bar' }>; mark: Mark; width: number }) {
  const longest = Math.max(...chart.bars.map((b) => b.label.length)) * CH;
  const slotAt = (W: number) => frame(W).plotW / chart.bars.length;
  // Category labels are rotated when they would collide side by side.
  const tilt = longest > slotAt(width) - 6;
  const f = frame(width, tilt ? Math.round(longest * 0.64) : 0);
  const max = niceMax(Math.max(...chart.bars.map((b) => b.value)));
  const slot = f.plotW / chart.bars.length;
  const bw = Math.min(56, slot * 0.62);
  const baseY = f.PAD.t + f.plotH;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="chart-svg" role="group" aria-label={`${chart.title}. Bar chart.`}>
      <Grid f={f} max={max} />
      {chart.bars.map((b, i) => {
        const h = (b.value / max) * f.plotH;
        const x = f.PAD.l + i * slot + (slot - bw) / 2;
        const y = baseY - h;
        const cx = x + bw / 2;
        return (
          <g key={b.label} className="di-mark" {...mark(`${b.label}: ${b.value} ${chart.unit}`)}>
            <rect x={x - 4} y={f.PAD.t} width={bw + 8} height={f.plotH} fill="transparent" />
            <path className="di-bar" d={`M${x},${baseY} V${y + 4} q0,-4 4,-4 H${x + bw - 4} q4,0 4,4 V${baseY} Z`} />
            <text x={cx} y={y - 6} textAnchor="middle" className="value-text">
              {b.value}
            </text>
            {tilt ? (
              <text x={cx} y={baseY + 14} textAnchor="end" className="axis-text" transform={`rotate(-40 ${cx} ${baseY + 14})`}>
                {b.label}
              </text>
            ) : (
              <text x={cx} y={baseY + 16} textAnchor="middle" className="axis-text">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
      <line className="baseline" x1={f.PAD.l} x2={f.W - f.PAD.r} y1={baseY} y2={baseY} />
    </svg>
  );
}

function Lines({ chart, mark, width }: { chart: Extract<Chart, { kind: 'line' }>; mark: Mark; width: number }) {
  const f = frame(width);
  const max = niceMax(Math.max(...chart.series.flatMap((s) => s.values)));
  const n = chart.xLabels.length;
  // Room for end-of-line labels on wide charts; narrow charts rely on the legend above.
  const endRoom = f.narrow ? 12 : Math.max(...chart.series.map((s) => s.label.length)) * CH + 16;
  const sx = (i: number) => f.PAD.l + 12 + (i / (n - 1)) * (f.plotW - 12 - endRoom);
  const sy = (v: number) => f.PAD.t + (1 - v / max) * f.plotH;
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
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="chart-svg" role="group" aria-label={`${chart.title}. Line graph.`}>
        <Grid f={f} max={max} />
        {chart.xLabels.map((l, i) => (
          <text key={l} x={sx(i)} y={f.H - f.PAD.b + 16} textAnchor="middle" className="axis-text">
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
            {!f.narrow && (
              <text x={sx(n - 1) + 12} y={endY[k]} className="end-label">
                {s.label}
              </text>
            )}
          </g>
        ))}
        <line className="baseline" x1={f.PAD.l} x2={f.W - f.PAD.r} y1={f.PAD.t + f.plotH} y2={f.PAD.t + f.plotH} />
      </svg>
    </>
  );
}

/**
 * Circle graph: percentages sit inside the slices (large enough to read on a
 * phone) and an HTML legend below names every slice in clockwise order, so no
 * label is crowded at the rim or depends on color alone.
 */
function Pie({ chart, mark }: { chart: Extract<Chart, { kind: 'pie' }>; mark: Mark }) {
  const S = 240;
  const c = S / 2;
  const R = 112;
  let acc = 0;
  const slices = chart.slices.map((s, k) => {
    const a0 = (acc / 100) * 2 * Math.PI - Math.PI / 2;
    acc += s.pct;
    const a1 = (acc / 100) * 2 * Math.PI - Math.PI / 2;
    return { ...s, k, a0, a1, mid: (a0 + a1) / 2 };
  });
  const p = (a: number, r = R) => `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
  return (
    <div className="di-pie-wrap">
      <svg viewBox={`0 0 ${S} ${S}`} className="chart-svg di-pie" role="group" aria-label={`${chart.title}. Circle graph.`}>
        {slices.map((s) => (
          <g key={s.label} className="di-mark" {...mark(`${s.label}: ${s.pct}%`)}>
            <path className={`di-slice slot-${s.k + 1}`} d={`M${c},${c} L${p(s.a0)} A${R},${R} 0 ${s.pct > 50 ? 1 : 0} 1 ${p(s.a1)} Z`} />
            {s.pct >= 6 && (
              <text x={c + R * 0.64 * Math.cos(s.mid)} y={c + R * 0.64 * Math.sin(s.mid) + 5} textAnchor="middle" className="slice-text">
                {s.pct}%
              </text>
            )}
          </g>
        ))}
      </svg>
      <ul className="legend pie-legend" aria-label="Legend, clockwise from the top">
        {slices.map((s) => (
          <li key={s.label}>
            <span className={`swatch slot-${s.k + 1}`} aria-hidden="true" />
            <span className="pie-legend-label">{s.label}</span>
            <span className="pie-legend-pct">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Scatter({ chart, mark, width }: { chart: Extract<Chart, { kind: 'scatter' }>; mark: Mark; width: number }) {
  const f = frame(width, 16);
  const xMax = Math.ceil(Math.max(...chart.points.map((pt) => pt[0])) + 1);
  const yMin = 50;
  const yMax = 100;
  const left = f.PAD.l + 8;
  const sx = (x: number) => left + (x / xMax) * (f.W - f.PAD.r - left);
  const sy = (y: number) => f.PAD.t + (1 - (y - yMin) / (yMax - yMin)) * f.plotH;
  const baseY = f.PAD.t + f.plotH;
  // Skip every other x tick when they would crowd.
  const every = (f.W - f.PAD.r - left) / xMax < 22 ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="chart-svg" role="group" aria-label={`${chart.title}. Scatterplot.`}>
      <g className="grid" aria-hidden="true">
        {[50, 60, 70, 80, 90, 100].map((y) => (
          <g key={y}>
            <line x1={left} x2={f.W - f.PAD.r} y1={sy(y)} y2={sy(y)} />
            <text x={left - 6} y={sy(y) + 4} textAnchor="end" className="axis-text">
              {y}
            </text>
          </g>
        ))}
        {Array.from({ length: xMax + 1 }, (_, x) =>
          x % every === 0 ? (
            <text key={x} x={sx(x)} y={baseY + 16} textAnchor="middle" className="axis-text">
              {x}
            </text>
          ) : null,
        )}
      </g>
      <text x={left + (f.W - f.PAD.r - left) / 2} y={f.H - 6} textAnchor="middle" className="axis-title">
        {chart.xLabel}
      </text>
      <text x={14} y={f.PAD.t + f.plotH / 2} textAnchor="middle" className="axis-title" transform={`rotate(-90 14 ${f.PAD.t + f.plotH / 2})`}>
        {chart.yLabel}
      </text>
      {chart.points.map(([x, y], i) => (
        <g key={i} className="di-mark" {...mark(`${chart.xLabel} ${x}, ${chart.yLabel.toLowerCase()} ${y}`)}>
          <circle cx={sx(x)} cy={sy(y)} r={12} fill="transparent" />
          <circle className="di-dot" cx={sx(x)} cy={sy(y)} r={5} />
        </g>
      ))}
      <line className="baseline" x1={left} x2={f.W - f.PAD.r} y1={baseY} y2={baseY} />
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
