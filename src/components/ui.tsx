import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={`card ${pad ? "pad" : ""} ${className}`}>{children}</div>;
}

export function Kpi({
  icon,
  tone = "",
  label,
  value,
  sub,
}: {
  icon: IconName;
  tone?: "" | "g" | "y" | "r" | "p";
  label: string;
  value: string;
  sub: string;
}) {
  const stroke = tone === "g" ? "g" : tone === "y" ? "y" : tone === "r" ? "b" : "a";
  return (
    <div className="card pad kpi">
      <div className="row">
        <span className={`iconbox ${tone}`}>
          <Icon name={icon} className={stroke} />
        </span>
        <div>
          <div className="tiny">{label}</div>
          <div className="val">{value}</div>
        </div>
      </div>
      <div className="tiny" style={{ marginTop: 8 }}>
        {sub}
      </div>
    </div>
  );
}

export function Bar({
  value,
  tone = "accent",
  height = 7,
}: {
  value: number;
  tone?: "accent" | "good" | "warn" | "bad" | "muted";
  height?: number;
}) {
  const colour =
    tone === "good"
      ? "var(--good)"
      : tone === "warn"
        ? "var(--warn)"
        : tone === "bad"
          ? "var(--bad)"
          : tone === "muted"
            ? "#c6cbd6"
            : "var(--accent)";
  return (
    <div className="bar" style={{ height }}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: colour }} />
    </div>
  );
}

export function LabelledBar({
  label,
  valueLabel,
  plain,
  value,
  tone = "accent",
}: {
  label: string;
  valueLabel?: string;
  plain?: string;
  value: number;
  tone?: "accent" | "good" | "warn" | "bad" | "muted";
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="between">
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        {valueLabel ? <b style={{ fontSize: 13 }}>{valueLabel}</b> : null}
      </div>
      <Bar value={value} tone={tone} />
      {plain ? <span className="tiny">{plain}</span> : null}
    </div>
  );
}

export function Donut({
  slices,
  size = 150,
  thickness = 22,
  centre,
}: {
  slices: { label: string; pct: number; colour: string }[];
  size?: number;
  thickness?: number;
  centre?: { top: string; bottom: string };
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcs = slices.reduce<{ label: string; colour: string; length: number; offset: number }[]>(
    (acc, s) => {
      const previous = acc.at(-1);
      const offset = previous ? previous.offset + previous.length : 0;
      return [...acc, { label: s.label, colour: s.colour, length: (s.pct / 100) * circumference, offset }];
    },
    [],
  );

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.colour}
              strokeWidth={thickness}
              strokeDasharray={`${a.length} ${circumference - a.length}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </g>
      </svg>
      {centre && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.02em" }}>{centre.top}</div>
          <div className="tiny">{centre.bottom}</div>
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; colour: string; value?: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <div key={i.label}>
          <span className="dot" style={{ background: i.colour }} />
          {i.label}
          {i.value ? <b style={{ color: "var(--ink)" }}>{i.value}</b> : null}
        </div>
      ))}
    </div>
  );
}

export function Gauge({
  value,
  max = 100,
  label,
  sub,
  size = 170,
}: {
  value: number;
  max?: number;
  label: string;
  sub: string;
  size?: number;
}) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const filled = (Math.min(value, max) / max) * circumference;
  const tone = value >= 70 ? "var(--good)" : value >= 45 ? "var(--warn)" : "var(--bad)";

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#eef0f4"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={tone}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="600" fill="#0a0c11">
          {value}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill="#98a0ae">
          out of {max}
        </text>
      </svg>
      <b style={{ fontSize: 14 }}>{label}</b>
      <span className="tiny" style={{ textAlign: "center" }}>
        {sub}
      </span>
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  aside,
}: {
  icon?: IconName;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="between" style={{ marginBottom: 14 }}>
      <div className="row">
        {icon && <Icon name={icon} />}
        <h3>{title}</h3>
      </div>
      {aside}
    </div>
  );
}
