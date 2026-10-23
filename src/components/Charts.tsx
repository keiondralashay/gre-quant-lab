import { useId, useMemo, useRef, useState } from 'react';

/**
 * Small SVG line chart: one y-axis, ≤ 3 series in fixed categorical order,
 * legend + direct end labels (identity is never color alone), a crosshair
 * tooltip that lists every series at the hovered day, and a table view.
 */
export interface LineSeries {
  key: string;
  label: string;
  /** Fixed slot 1–3 → --series-1..3 (color follows the entity, never its rank). */
  slot: 1 | 2 | 3;
  points: { x: number; y: number; n: number }[];
}

const W = 640;
const H = 220;
const PAD = { l: 44, r: 92, t: 12, b: 28 };

const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function LineChart({
  title,
  series,
  yMax,
  yFormat,
  yLabel,
  emptyText,
}: {
  title: string;
  series: LineSeries[];
  yMax?: number;
  yFormat: (v: number) => string;
  yLabel: string;
  emptyText: string;
}) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId();
  const live = series.filter((s) => s.points.length > 0);
  const xs = useMemo(() => [...new Set(live.flatMap((s) => s.points.map((p) => p.x)))].sort((a, b) => a - b), [live]);

  if (!xs.length) {
    return (
      <figure className="chart">
        <figcaption className="chart-title">{title}</figcaption>
        <p className="empty">{emptyText}</p>
      </figure>
    );
  }

  const maxY = yMax ?? Math.max(1, ...live.flatMap((s) => s.points.map((p) => p.y))) * 1.1;
  const x0 = xs[0];
  const x1 = xs.length > 1 ? xs[xs.length - 1] : xs[0] + 1;
  const sx = (x: number) => (xs.length === 1 ? PAD.l + (W - PAD.l - PAD.r) / 2 : PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r));
  const sy = (y: number) => PAD.t + (1 - y / maxY) * (H - PAD.t - PAD.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);

  // Nearest X (not dead-center) for the crosshair.
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = xs[0];
    for (const x of xs) if (Math.abs(sx(x) - px) < Math.abs(sx(best) - px)) best = x;
    setHoverX(best);
  };

  const at = (s: LineSeries, x: number) => s.points.find((p) => p.x === x);

  // Direct end labels: keep at least 14px apart so series ending at similar values stay readable.
  const endLabelY: Record<string, number> = {};
  const ends = live.map((s) => ({ key: s.key, y: sy(s.points[s.points.length - 1].y) + 4 })).sort((a, b) => a.y - b.y);
  for (let k = 0; k < ends.length; k++) {
    if (k > 0 && ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14;
  }
  const overflow = ends.length ? ends[ends.length - 1].y - (H - PAD.b + 4) : 0;
  for (const e of ends) endLabelY[e.key] = overflow > 0 ? e.y - overflow : e.y;

  return (
    <figure className="chart viz-root" aria-labelledby={titleId}>
      <div className="chart-head">
        <figcaption id={titleId} className="chart-title">
          {title}
        </figcaption>
        <button className="btn-link" aria-pressed={table} onClick={() => setTable((t) => !t)}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {live.length > 1 && (
        <ul className="legend" aria-label="Legend">
          {live.map((s) => (
            <li key={s.key}>
              <span className={`swatch slot-${s.slot}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {table ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                {live.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xs.map((x) => (
                <tr key={x}>
                  <th scope="row">{fmtDay(x)}</th>
                  {live.map((s) => {
                    const p = at(s, x);
                    return <td key={s.key}>{p ? `${yFormat(p.y)} (n=${p.n})` : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-plot">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${yLabel} by day. Use “Show table” for values.`} onPointerMove={onMove} onPointerLeave={() => setHoverX(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} className="grid" />
                <text x={PAD.l - 6} y={sy(t) + 4} textAnchor="end" className="axis-text">
                  {yFormat(t)}
                </text>
              </g>
            ))}
            {xs.map((x, i) =>
              xs.length <= 8 || i % Math.ceil(xs.length / 6) === 0 || i === xs.length - 1 ? (
                <text key={x} x={sx(x)} y={H - 8} textAnchor="middle" className="axis-text">
                  {fmtDay(x)}
                </text>
              ) : null,
            )}
            {live.map((s) => {
              const pts = s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');
              const last = s.points[s.points.length - 1];
              const labelY = endLabelY[s.key];
              return (
                <g key={s.key} className={`series slot-${s.slot}`}>
                  {s.points.length > 1 && <polyline points={pts} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                  {s.points.map((p) => (
                    <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={4} className="dot" />
                  ))}
                  <text x={sx(last.x) + 8} y={labelY} className="end-label">
                    {live.length > 1 ? `${s.label} ` : ''}
                    {yFormat(last.y)}
                  </text>
                </g>
              );
            })}
            {hoverX !== null && <line x1={sx(hoverX)} x2={sx(hoverX)} y1={PAD.t} y2={H - PAD.b} className="crosshair" />}
          </svg>
          {hoverX !== null && (
            <div className="tooltip" style={{ left: `${(sx(hoverX) / W) * 100}%` }} role="status">
              <div className="tooltip-title">{fmtDay(hoverX)}</div>
              {live.map((s) => {
                const p = at(s, hoverX);
                return (
                  <div key={s.key} className="tooltip-row">
                    <span className={`swatch slot-${s.slot}`} aria-hidden="true" />
                    <strong>{p ? yFormat(p.y) : '—'}</strong> <span>{s.label}</span>
                    {p && <span className="muted"> · n={p.n}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** Horizontal accuracy bars (single measure; label and value in text ink). */
export function AccuracyBars({ rows, emptyText }: { rows: { label: string; correct: number; total: number }[]; emptyText: string }) {
  if (!rows.length) return <p className="empty">{emptyText}</p>;
  return (
    <ul className="acc-bars">
      {rows.map((r) => {
        const p = Math.round((r.correct / r.total) * 100);
        return (
          <li key={r.label} title={`${r.label}: ${r.correct} of ${r.total} correct`}>
            <span className="acc-label">{r.label}</span>
            <span className="acc-track" aria-hidden="true">
              <span className="acc-fill" style={{ width: `${p}%` }} />
            </span>
            <span className="acc-value">
              {p}% <span className="muted">({r.correct}/{r.total})</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
