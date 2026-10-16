'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Point {
  date: string;
  completed: number;
}

function label(date: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

/**
 * Completions per day (single series → one hue, no legend; the card title
 * names it). Bars are anchored to the baseline with rounded data-ends, each
 * column is a full-height hover target with a tooltip, and an sr-only table
 * carries the same numbers for assistive tech.
 */
export function ActivityChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.completed));
  // Round the axis up to a clean step.
  const top = Math.ceil(max / 2) * 2;
  const ticks = [0, top / 2, top];
  const W = 560;
  const H = 180;
  const padL = 24;
  const padB = 22;
  const plotW = W - padL;
  const plotH = H - padB - 8;
  const slot = plotW / data.length;
  const barW = Math.min(22, slot - 6);
  const y = (v: number) => 8 + plotH - (v / top) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full overflow-visible" role="img" aria-label="Tasks completed per day over the last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="stroke-ink-200" strokeWidth={1} strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="fill-ink-400 text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = Math.max(0, y(0) - y(d.completed));
          const r = Math.min(4, h / 2);
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            >
              {/* Hit target: whole column, wider than the mark */}
              <rect x={padL + i * slot} y={0} width={slot} height={H - padB} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`}
                  className={cn(
                    'transition-opacity',
                    'fill-brand-600 dark:fill-brand-500',
                    hover !== null && hover !== i && 'opacity-40',
                  )}
                />
              )}
              {(i % 2 === 1 || i === data.length - 1) && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" className={cn('text-[10px]', i === data.length - 1 ? 'fill-ink-700 font-semibold' : 'fill-ink-400')}>
                  {i === data.length - 1 ? 'Today' : label(d.date, { day: 'numeric', month: 'short' })}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-ink-200 bg-elevated px-3 py-2 text-xs shadow-lift"
          style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%`, top: `${(y(data[hover].completed) / H) * 100}%` }}
        >
          <p className="font-semibold text-ink-900">{label(data[hover].date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <p className="text-ink-500">
            <span className="font-semibold tabular-nums text-ink-900">{data[hover].completed}</span> completed
          </p>
        </div>
      )}

      <table className="sr-only">
        <caption>Tasks completed per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Completed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
