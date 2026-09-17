"use client";

import { useMemo, useState } from "react";
import { Icon } from "../Icon";
import { Bar, Card, SectionTitle } from "../ui";
import { PortfolioValueChart } from "../charts/PortfolioValueChart";
import { money } from "@/lib/portfolio";
import { defaultKnobs, deployTargets, simulate, strategies } from "@/lib/strategies";

type Deployment = { strategyId: string; accountId: string; knobs: Record<string, number> };

const formatKnob = (value: number, unit: "%" | "£" | "months") =>
  unit === "£" ? money(value) : unit === "%" ? `${value}%` : `${value} month${value === 1 ? "" : "s"}`;

export function Strategies() {
  const [activeId, setActiveId] = useState(strategies[0].id);
  const [knobsById, setKnobsById] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(strategies.map((s) => [s.id, defaultKnobs(s)])),
  );
  const [deployed, setDeployed] = useState<Deployment[]>([]);
  const [target, setTarget] = useState(deployTargets[0].accountId);

  const strategy = strategies.find((s) => s.id === activeId) ?? strategies[0];
  const knobs = knobsById[strategy.id];
  const sim = useMemo(() => simulate(strategy.id, knobs), [strategy.id, knobs]);
  const live = deployed.find((d) => d.strategyId === strategy.id);

  const chartData = sim.months.map((m) => ({ time: m.time, you: m.strategy, tracker: m.nothing }));
  const better = sim.differenceInPounds >= 0;
  const calmer = sim.worstFallPct <= sim.worstFallDoingNothingPct;

  return (
    <div className="stack">
      <div className="between">
        <div>
          <h1>Try a strategy before you use it</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Move the sliders, watch what it would have done to your own money, then switch it on for one account.
          </p>
        </div>
        <span className="chip info">
          <Icon name="lock" className="a" style={{ width: 13, height: 13 }} />
          Practice mode — no real orders
        </span>
      </div>

      <div className="seg wrap-sm">
        {strategies.map((s) => (
          <button key={s.id} className={s.id === strategy.id ? "on" : ""} onClick={() => setActiveId(s.id)}>
            <Icon name={s.icon} style={{ width: 14, height: 14 }} />
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid g2">
        <Card>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className="iconbox p">
              <Icon name={strategy.icon} style={{ stroke: "var(--purple)" }} />
            </span>
            <div>
              <h2 style={{ fontSize: 18 }}>{strategy.oneLiner}</h2>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {strategy.plainHow}
              </p>
            </div>
          </div>

          <hr />

          <div style={{ display: "grid", gap: 16 }}>
            {strategy.knobs.map((k) => (
              <label key={k.id} style={{ display: "grid", gap: 6 }}>
                <span className="between">
                  <span style={{ fontSize: 14 }}>{k.label}</span>
                  <b style={{ fontSize: 14 }}>{formatKnob(knobs[k.id], k.unit)}</b>
                </span>
                <input
                  type="range"
                  min={k.min}
                  max={k.max}
                  step={k.step}
                  value={knobs[k.id]}
                  onChange={(e) =>
                    setKnobsById((all) => ({
                      ...all,
                      [strategy.id]: { ...all[strategy.id], [k.id]: Number(e.target.value) },
                    }))
                  }
                />
                <span className="tiny">{k.plain}</span>
              </label>
            ))}
          </div>

          <hr />

          <ul className="clean">
            <li className="row">
              <Icon name="check" className="g" />
              <div>
                <b style={{ fontSize: 14 }}>Why it suits you</b>
                <div className="tiny">{strategy.suitsYou}</div>
              </div>
            </li>
            <li className="row">
              <Icon name="alert" className="y" />
              <div>
                <b style={{ fontSize: 14 }}>What to watch</b>
                <div className="tiny">{strategy.watchOut}</div>
              </div>
            </li>
          </ul>
        </Card>

        <Card>
          <SectionTitle
            icon="chart"
            title="If you had run this for the last year"
            aside={<span className="tiny">Solid: strategy · Dashed: doing nothing</span>}
          />
          <PortfolioValueChart data={chartData} months={chartData.length} height={220} />
          <div className="grid g3" style={{ marginTop: 14 }}>
            <div>
              <div className="tiny">Ends with</div>
              <b style={{ fontSize: 18 }}>{money(sim.endValue)}</b>
              <div className="tiny" style={{ color: better ? "var(--good)" : "var(--bad)" }}>
                {better ? "+" : "−"}
                {money(Math.abs(sim.differenceInPounds)).replace("−", "")} vs doing nothing
              </div>
            </div>
            <div>
              <div className="tiny">Worst drop along the way</div>
              <b style={{ fontSize: 18 }}>−{sim.worstFallPct}%</b>
              <div className="tiny" style={{ color: calmer ? "var(--good)" : "var(--bad)" }}>
                {calmer ? "Calmer" : "Bumpier"} than doing nothing (−{sim.worstFallDoingNothingPct}%)
              </div>
            </div>
            <div>
              <div className="tiny">Trades a year</div>
              <b style={{ fontSize: 18 }}>{sim.tradesPerYear}</b>
              <div className="tiny">about {money(sim.costPerYear)} in costs</div>
            </div>
          </div>
          <hr />
          <p style={{ fontSize: 14 }}>{sim.plainVerdict}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle
          icon="bolt"
          title="What it would do to your holdings"
          aside={<span className="tiny">At today&apos;s prices</span>}
        />
        {sim.trades.length === 0 ? (
          <p style={{ fontSize: 14 }}>Nothing to trade today at these settings.</p>
        ) : (
          <ul className="clean">
            {sim.trades.map((t) => (
              <li key={`${t.action}-${t.symbol}`} className="holding-row">
                <span className={`iconbox ${t.action === "Sell" ? "r" : "g"}`}>
                  <Icon name={t.action === "Sell" ? "down" : "up"} className={t.action === "Sell" ? "r" : "g"} />
                </span>
                <div>
                  <b>
                    {t.action} {t.name}
                  </b>
                  <div className="tiny">{t.why}</div>
                </div>
                <div className="hide-sm">
                  <Bar value={Math.min(100, (t.amount / 5000) * 100)} tone={t.action === "Sell" ? "warn" : "good"} height={8} />
                  <span className="tiny">{t.repeat}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b>{money(t.amount)}</b>
                  <div className="tiny">{t.action === "Sell" ? "off the table" : "put to work"}</div>
                </div>
                <span className={`chip ${t.action === "Sell" ? "warn" : "good"}`}>{t.action}</span>
              </li>
            ))}
          </ul>
        )}

        <hr />
        <div className="between">
          <div className="row">
            <Icon name="link" className="a" />
            <div>
              <b style={{ fontSize: 14 }}>Run it on</b>
              <div className="tiny">You can pause or undo it at any time</div>
            </div>
            <select
              className="btn sec sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="Account to run the strategy on"
            >
              {deployTargets.map((d) => (
                <option key={d.accountId} value={d.accountId}>
                  {d.provider} · {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            {live && (
              <button
                className="btn sec sm"
                onClick={() => setDeployed((all) => all.filter((d) => d.strategyId !== strategy.id))}
              >
                Turn off
              </button>
            )}
            <button
              className="btn blue sm"
              disabled={Boolean(live)}
              onClick={() =>
                setDeployed((all) => [
                  ...all.filter((d) => d.strategyId !== strategy.id),
                  { strategyId: strategy.id, accountId: target, knobs },
                ])
              }
            >
              <Icon name="check" className="w" style={{ width: 14, height: 14 }} />
              {live ? "Running" : "Switch it on"}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon="clock"
          title="Strategies you have switched on"
          aside={<span className="tiny">Practice mode — you stay in control</span>}
        />
        {deployed.length === 0 ? (
          <p className="tiny">None yet. Try one above — nothing happens to your money until you switch it on.</p>
        ) : (
          <ul className="clean">
            {deployed.map((d) => {
              const s = strategies.find((x) => x.id === d.strategyId);
              const account = deployTargets.find((t) => t.accountId === d.accountId);
              if (!s || !account) return null;
              return (
                <li key={d.strategyId} className="row between">
                  <div className="row">
                    <span className="iconbox g">
                      <Icon name={s.icon} className="g" />
                    </span>
                    <div>
                      <b style={{ fontSize: 14 }}>{s.name}</b>
                      <div className="tiny">
                        {account.provider} · {account.label} ·{" "}
                        {s.knobs.map((k) => `${k.label.toLowerCase()} ${formatKnob(d.knobs[k.id], k.unit)}`).join(", ")}
                      </div>
                    </div>
                  </div>
                  <span className="chip good">Running</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
