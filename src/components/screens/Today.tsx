"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { Bar, Card, Donut, Gauge, Kpi, Legend, SectionTitle } from "../ui";
import { PortfolioValueChart } from "../charts/PortfolioValueChart";
import { MiniChart, Ticker } from "../tradingview/widgets";
import {
  allocation,
  allocationOf,
  badYearLossPct,
  feesPerYear,
  holdings,
  idleCash,
  money,
  pct,
  totalProfit,
  totalValue,
  valueHistory,
  weekChange,
  weekMovers,
} from "@/lib/portfolio";

const ranges = [
  { label: "1M", months: 2 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
];

export function Today() {
  const [range, setRange] = useState("1Y");
  const months = ranges.find((r) => r.label === range)?.months ?? 12;
  const ahead = valueHistory.at(-1)!.you - valueHistory.at(-1)!.tracker;
  const biggest = [...holdings].filter((h) => h.kind === "share").sort((a, b) => b.value - a.value)[0];
  const ranked = [...holdings].filter((h) => h.kind !== "cash").sort((a, b) => b.value - a.value);
  const maxMove = Math.max(...weekMovers.map((m) => Math.abs(m.amount)));

  return (
    <div className="stack">
      <Ticker
        symbols={[
          { proName: "AMEX:VT", title: "World" },
          { proName: "AMEX:SPY", title: "US 500" },
          { proName: "NASDAQ:NVDA", title: "Nvidia" },
          { proName: "NASDAQ:AAPL", title: "Apple" },
          { proName: "LSE:ULVR", title: "Unilever" },
          { proName: "FX:GBPUSD", title: "£ vs $" },
        ]}
      />

      <div className="main-grid">
        <div className="stack">
          <Card>
            <div className="between">
              <div>
                <div className="tiny">Everything you own</div>
                <div className="val-xl">{money(totalValue)}</div>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="chip good">
                    <Icon name="up" className="g" style={{ width: 13, height: 13 }} />
                    {money(weekChange.amount)} · {weekChange.pct}%
                  </span>
                  <span className="tiny">this week</span>
                </div>
              </div>
              <div className="seg">
                {ranges.map((r) => (
                  <button key={r.label} className={range === r.label ? "on" : ""} onClick={() => setRange(r.label)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <PortfolioValueChart data={valueHistory} months={months} />
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <Legend
                items={[
                  { label: "You", colour: "var(--accent)" },
                  { label: "If you'd just bought a world tracker", colour: "#c6cbd6" },
                ]}
              />
              <span className="spacer" style={{ flex: 1 }} />
              <span className="chip info">You&apos;re {money(ahead)} ahead</span>
            </div>
          </Card>

          <div className="grid g4">
            <Kpi icon="coin" tone="g" label="Profit all time" value={money(totalProfit)} sub="After what you paid in" />
            <Kpi icon="scale" tone="y" label="Fees a year" value={money(feesPerYear)} sub="0.49% of everything" />
            <Kpi
              icon="target"
              tone="r"
              label="Biggest single company"
              value={`${allocationOf(biggest).toFixed(1)}%`}
              sub={`${biggest.name} — plus more of it hidden in your funds`}
            />
            <Kpi icon="clock" tone="" label="Cash doing nothing" value={money(idleCash)} sub="Losing value to rising prices" />
          </div>

          <Card>
            <SectionTitle
              icon="layers"
              title="What you own"
              aside={<span className="tiny">{ranked.length} holdings · live prices</span>}
            />
            <ul className="clean">
              {ranked.map((h) => (
                <li key={h.symbol} className="holding-row">
                  <div className="tick" style={{ background: h.colour }}>
                    {h.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <b>{h.name}</b>
                    <div className="tiny">
                      {money(h.value)} · {allocationOf(h).toFixed(1)}%
                    </div>
                  </div>
                  <div className="hide-sm">
                    {h.tvSymbol ? <MiniChart symbol={h.tvSymbol} range="3M" height={44} /> : null}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b style={{ color: h.returnPct >= 0 ? "var(--good)" : "var(--bad)" }}>{pct(h.returnPct)}</b>
                    <div className="tiny">{h.returnWindow}</div>
                  </div>
                  <div>{h.flag ? <span className={`chip ${h.flag.tone}`}>{h.flag.label}</span> : null}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <SectionTitle icon="shield" title="How healthy is this?" />
            <Gauge
              value={64}
              label="Solid, with one weak spot"
              sub="Costs and spread are fine. One holding is far too large."
            />
            <hr />
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { label: "Spread across the world", value: 78, tone: "good" as const },
                { label: "Cost of owning it", value: 71, tone: "good" as const },
                { label: "Size of your biggest bet", value: 28, tone: "bad" as const },
              ].map((r) => (
                <div key={r.label} style={{ display: "grid", gap: 6 }}>
                  <div className="between">
                    <span className="tiny">{r.label}</span>
                    <b style={{ fontSize: 13 }}>{r.value}</b>
                  </div>
                  <Bar value={r.value} tone={r.tone} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon="globe" title="Where your money sits" />
            <div className="row" style={{ gap: 18 }}>
              <Donut
                slices={allocation.map((a) => ({ label: a.label, pct: a.pct, colour: a.colour }))}
                centre={{ top: "68%", bottom: "in shares" }}
              />
              <div style={{ display: "grid", gap: 8, flex: 1 }}>
                {allocation.map((a) => (
                  <div key={a.label} className="between">
                    <span className="row" style={{ gap: 7 }}>
                      <span className="dot" style={{ background: a.colour }} />
                      <span style={{ fontSize: 13 }}>{a.label}</span>
                    </span>
                    <b style={{ fontSize: 13 }}>{a.pct}%</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon="chart" title="What moved you this week" />
            <div style={{ display: "grid", gap: 10 }}>
              {weekMovers.map((m) => (
                <div key={m.label} className="row">
                  <span style={{ width: 96, fontSize: 13 }}>{m.label}</span>
                  <div style={{ flex: 1, display: "flex", justifyContent: m.amount >= 0 ? "flex-start" : "flex-end" }}>
                    <div
                      style={{
                        height: 18,
                        borderRadius: 6,
                        width: `${(Math.abs(m.amount) / maxMove) * 100}%`,
                        background: m.amount >= 0 ? "var(--good)" : "var(--bad)",
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <b style={{ width: 62, textAlign: "right", fontSize: 13, color: m.amount >= 0 ? "var(--good)" : "var(--bad)" }}>
                    {money(m.amount)}
                  </b>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon="alert" title="Needs you" />
            <ul className="clean">
              <li className="row">
                <span className="iconbox r">
                  <Icon name="target" className="b" />
                </span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>Nvidia is too big</b>
                  <div className="tiny">A bad month there decides your whole year.</div>
                </div>
                <Link className="btn sm" href="/actions">
                  Fix
                </Link>
              </li>
              <li className="row">
                <span className="iconbox y">
                  <Icon name="alert" className="y" />
                </span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>A bad year would cost {badYearLossPct}%</b>
                  <div className="tiny">You said you could stomach 20%.</div>
                </div>
                <Link className="btn sm sec" href="/risk">
                  See why
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
