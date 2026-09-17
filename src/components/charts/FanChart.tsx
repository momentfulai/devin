"use client";

import type { Band } from "@/lib/future";
import { money } from "@/lib/portfolio";

/**
 * The spread of possible futures as a widening fan: darker in the middle where
 * most of the made-up years land, pale at the edges where the rare ones do.
 */
export function FanChart({
  bands,
  compare,
  height = 280,
}: {
  bands: Band[];
  /** A second, pretend portfolio drawn dashed on top. */
  compare?: Band[];
  height?: number;
}) {
  const width = 720;
  const padLeft = 8;
  const padRight = 64;
  const padTop = 12;
  const padBottom = 26;
  const all = [...bands, ...(compare ?? [])];
  const top = Math.max(...all.map((b) => b.great));
  const bottom = Math.min(...all.map((b) => b.bad), 0);
  const years = bands[bands.length - 1].year;

  const x = (year: number) => padLeft + (year / years) * (width - padLeft - padRight);
  const y = (value: number) =>
    padTop + (1 - (value - bottom) / (top - bottom || 1)) * (height - padTop - padBottom);

  const line = (pick: (b: Band) => number, source: Band[] = bands) =>
    source.map((b, i) => `${i === 0 ? "M" : "L"}${x(b.year).toFixed(1)},${y(pick(b)).toFixed(1)}`).join(" ");

  const area = (hi: (b: Band) => number, lo: (b: Band) => number, source: Band[] = bands) =>
    `${line(hi, source)} ${[...source]
      .reverse()
      .map((b) => `L${x(b.year).toFixed(1)},${y(lo(b)).toFixed(1)}`)
      .join(" ")} Z`;

  const ticks = [bottom, bottom + (top - bottom) / 2, top];
  const yearTicks = bands.filter((b) => b.year > 0 && b.year % Math.max(1, Math.round(years / 5)) === 0);
  const last = bands[bands.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Range of possible future values">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="3 5" />
          <text x={width - padRight + 8} y={y(t) + 4} fontSize="11" fill="var(--ink-3)">
            {money(Math.round(t))}
          </text>
        </g>
      ))}

      <path d={area((b) => b.great, (b) => b.bad)} fill="var(--accent)" opacity={0.12} />
      <path d={area((b) => b.good, (b) => b.poor)} fill="var(--accent)" opacity={0.2} />
      <path d={line((b) => b.average)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />

      {compare && (
        <>
          <path d={area((b) => b.great, (b) => b.bad, compare)} fill="var(--warn)" opacity={0.12} />
          <path
            d={line((b) => b.average, compare)}
            fill="none"
            stroke="var(--warn)"
            strokeWidth={2.5}
            strokeDasharray="7 5"
          />
        </>
      )}

      {yearTicks.map((b) => (
        <text key={b.year} x={x(b.year)} y={height - 6} fontSize="11" fill="var(--ink-3)" textAnchor="middle">
          {b.year}y
        </text>
      ))}

      <g>
        <circle cx={x(last.year)} cy={y(last.average)} r={4} fill="var(--accent)" />
        <text x={x(last.year) + 8} y={y(last.average) - 8} fontSize="11" fill="var(--ink-2)">
          average
        </text>
      </g>
    </svg>
  );
}
