"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Bar, Card, Donut, Legend, SectionTitle } from "../ui";
import { PortfolioValueChart } from "../charts/PortfolioValueChart";
import { money } from "@/lib/portfolio";
import {
  defaultKnobs,
  deployTargets,
  presetKnobs,
  presets,
  projectCombo,
  simulateCombo,
  strategies,
} from "@/lib/strategies";

const formatKnob = (value: number, unit: "%" | "£" | "months") =>
  unit === "£" ? money(value) : unit === "%" ? `${value}%` : `${value} month${value === 1 ? "" : "s"}`;

export function Strategies() {
  const [tuningId, setTuningId] = useState(strategies[0].id);
  const [knobsById, setKnobsById] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(strategies.map((s) => [s.id, defaultKnobs(s)])),
  );
  const [on, setOn] = useState<string[]>([]);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [target, setTarget] = useState(deployTargets[0].accountId);

  const tuning = strategies.find((s) => s.id === tuningId) ?? strategies[0];
  const knobs = knobsById[tuning.id];

  // With nothing switched on there is still something to look at: the rule being tuned.
  const previewIds = on.length > 0 ? on : [tuning.id];
  const previewingOnly = on.length === 0;

  const sim = simulateCombo(previewIds, knobsById);
  const shift = projectCombo(previewIds, knobsById);
  const moved = shift.holdings.filter((h) => h.after !== h.before);

  const chartData = sim.months.map((m) => ({ time: m.time, you: m.strategy, tracker: m.nothing }));
  const better = sim.differenceInPounds >= 0;
  const calmer = sim.worstFallPct <= sim.worstFallDoingNothingPct;

  const toggle = (id: string) => {
    setPresetId(null);
    setTuningId(id);
    setOn((all) => (all.includes(id) ? all.filter((x) => x !== id) : [...all, id]));
  };

  const applyPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    if (presetId === id) {
      setPresetId(null);
      setOn([]);
      return;
    }
    setPresetId(id);
    setOn(preset.strategyIds);
    setKnobsById((all) => ({ ...all, ...presetKnobs(preset) }));
    setTuningId(preset.strategyIds[0]);
  };

  return (
    <div className="stack">
      <div className="between">
        <div>
          <h1>Build your plan</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Start from a ready-made set, switch individual rules on or off, and watch what the combination would have
            done to your own money.
          </p>
        </div>
        <span className="chip info">
          <Icon name="lock" className="a" style={{ width: 13, height: 13 }} />
          Practice mode — no real orders
        </span>
      </div>

      <Card>
        <SectionTitle
          icon="spark"
          title="Ready-made sets"
          aside={<span className="tiny">One tap switches on everything in the set</span>}
        />
        <div className="grid g4">
          {presets.map((p) => {
            const chosen = presetId === p.id;
            return (
              <button
                key={p.id}
                className={`preset ${chosen ? "on" : ""}`}
                onClick={() => applyPreset(p.id)}
                aria-pressed={chosen}
              >
                <span className={`iconbox ${chosen ? "g" : "p"}`}>
                  <Icon name={p.icon} style={{ stroke: chosen ? "var(--good)" : "var(--purple)" }} />
                </span>
                <b style={{ fontSize: 14 }}>{p.name}</b>
                <span className="tiny">{p.oneLiner}</span>
                <span className="tiny" style={{ color: "var(--ink-2)" }}>
                  {p.strategyIds.length} rules · {p.forWhom}
                </span>
                <span className={`chip ${chosen ? "good" : ""}`}>{chosen ? "On" : "Use this set"}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon="layers"
          title="The rules in your plan"
          aside={
            <span className="tiny">
              {on.length === 0 ? "Nothing switched on yet" : `${on.length} switched on`}
            </span>
          }
        />
        <div className="grid g4">
          {strategies.map((s) => {
            const running = on.includes(s.id);
            return (
              <div key={s.id} className={`rule ${running ? "on" : ""} ${s.id === tuning.id ? "tuning" : ""}`}>
                <button className="rule-body" onClick={() => setTuningId(s.id)} aria-label={`Tune ${s.name}`}>
                  <span className={`iconbox ${running ? "g" : ""}`}>
                    <Icon name={s.icon} className={running ? "g" : ""} />
                  </span>
                  <b style={{ fontSize: 14 }}>{s.name}</b>
                  <span className="tiny">{s.oneLiner}</span>
                </button>
                <button
                  className={`switch ${running ? "on" : ""}`}
                  onClick={() => toggle(s.id)}
                  role="switch"
                  aria-checked={running}
                  aria-label={`${running ? "Turn off" : "Switch on"} ${s.name}`}
                >
                  <span className="knob" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid g2">
        <Card>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className="iconbox p">
              <Icon name={tuning.icon} style={{ stroke: "var(--purple)" }} />
            </span>
            <div>
              <h2 style={{ fontSize: 18 }}>{tuning.oneLiner}</h2>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {tuning.plainHow}
              </p>
            </div>
          </div>

          <hr />

          <div style={{ display: "grid", gap: 16 }}>
            {tuning.knobs.map((k) => (
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
                  onChange={(e) => {
                    setPresetId(null);
                    setKnobsById((all) => ({
                      ...all,
                      [tuning.id]: { ...all[tuning.id], [k.id]: Number(e.target.value) },
                    }));
                  }}
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
                <div className="tiny">{tuning.suitsYou}</div>
              </div>
            </li>
            <li className="row">
              <Icon name="alert" className="y" />
              <div>
                <b style={{ fontSize: 14 }}>What to watch</b>
                <div className="tiny">{tuning.watchOut}</div>
              </div>
            </li>
          </ul>
        </Card>

        <Card>
          <SectionTitle
            icon="chart"
            title={previewingOnly ? "If you had run this one rule for a year" : "If you had run this plan for a year"}
            aside={<span className="tiny">Solid: your plan · Dashed: doing nothing</span>}
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
          {previewingOnly && (
            <p className="tiny" style={{ marginTop: 8 }}>
              This is a preview of {tuning.name.toLowerCase()} on its own. Switch rules on above to see them combined.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle
          icon="layers"
          title="Your portfolio the day after this plan starts"
          aside={<span className="tiny">Today&apos;s prices, first round of trades</span>}
        />
        <div className="grid g3" style={{ alignItems: "center" }}>
          <div>
            <div className="tiny" style={{ marginBottom: 8 }}>
              Now
            </div>
            <div className="row">
              <Donut
                slices={shift.mixBefore}
                size={128}
                centre={{ top: money(shift.invested.before + shift.cash.before), bottom: "today" }}
              />
              <Legend items={shift.mixBefore.map((s) => ({ label: s.label, colour: s.colour, value: `${s.pct}%` }))} />
            </div>
          </div>
          <div>
            <div className="tiny" style={{ marginBottom: 8 }}>
              After the plan runs
            </div>
            <div className="row">
              <Donut
                slices={shift.mixAfter}
                size={128}
                centre={{ top: money(shift.invested.after + shift.cash.after), bottom: "same money" }}
              />
              <Legend items={shift.mixAfter.map((s) => ({ label: s.label, colour: s.colour, value: `${s.pct}%` }))} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {shift.changes.map((c) => (
              <div key={c.label}>
                <div className="between">
                  <span className="tiny">{c.label}</span>
                  <span style={{ fontSize: 13 }}>
                    <span className="muted">{c.before}</span>{" "}
                    <Icon
                      name="up"
                      className={c.better ? "g" : "y"}
                      style={{ width: 12, height: 12, transform: "rotate(90deg)" }}
                    />{" "}
                    <b style={{ color: c.better ? "var(--good)" : "var(--ink)" }}>{c.after}</b>
                  </span>
                </div>
              </div>
            ))}
            <div>
              <div className="between">
                <span className="tiny">A bad year against your comfort limit</span>
                <b style={{ fontSize: 13 }}>limit −{shift.badYear.comfortLimit}%</b>
              </div>
              <Bar value={shift.badYear.before * 2.2} tone="bad" height={8} />
              <Bar
                value={shift.badYear.after * 2.2}
                tone={shift.badYear.after <= shift.badYear.comfortLimit ? "good" : "warn"}
                height={8}
              />
            </div>
          </div>
        </div>

        {moved.length > 0 && (
          <>
            <hr />
            <div className="tiny" style={{ marginBottom: 8 }}>
              What moves, holding by holding
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {moved.map((h) => {
                const scale = Math.max(h.before, h.after) || 1;
                const grew = h.after > h.before;
                return (
                  <div key={h.symbol}>
                    <div className="between">
                      <span style={{ fontSize: 13 }}>
                        <span className="dot" style={{ background: h.colour }} /> {h.name}
                      </span>
                      <span style={{ fontSize: 13 }}>
                        <span className="muted">{money(h.before)}</span> → <b>{money(h.after)}</b>{" "}
                        <span className="tiny" style={{ color: grew ? "var(--good)" : "var(--warn)" }}>
                          {grew ? "+" : "−"}
                          {money(Math.abs(h.after - h.before)).replace("−", "")}
                        </span>
                      </span>
                    </div>
                    <Bar value={(h.before / scale) * 100} tone="muted" height={6} />
                    <Bar value={(h.after / scale) * 100} tone={grew ? "good" : "warn"} height={6} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle
          icon="bolt"
          title="What this plan would trade"
          aside={<span className="tiny">At today&apos;s prices</span>}
        />
        {sim.trades.length === 0 ? (
          <p style={{ fontSize: 14 }}>Nothing to trade today at these settings.</p>
        ) : (
          <ul className="clean">
            {sim.trades.map((t) => (
              <li key={`${t.action}-${t.symbol}-${t.amount}`} className="holding-row">
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
                  <Bar
                    value={Math.min(100, (t.amount / 5000) * 100)}
                    tone={t.action === "Sell" ? "warn" : "good"}
                    height={8}
                  />
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
              <b style={{ fontSize: 14 }}>Run this plan on</b>
              <div className="tiny">You can switch any rule off at any time</div>
            </div>
            <select
              className="btn sec sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="Account to run the plan on"
            >
              {deployTargets.map((d) => (
                <option key={d.accountId} value={d.accountId}>
                  {d.provider} · {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            {on.length > 0 && (
              <button
                className="btn sec sm"
                onClick={() => {
                  setOn([]);
                  setPresetId(null);
                }}
              >
                Turn everything off
              </button>
            )}
            <button className="btn blue sm" disabled={on.includes(tuning.id)} onClick={() => toggle(tuning.id)}>
              <Icon name="check" className="w" style={{ width: 14, height: 14 }} />
              {on.includes(tuning.id) ? "Already on" : `Add ${tuning.name.toLowerCase()}`}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon="clock"
          title="Running now"
          aside={<span className="tiny">Practice mode — you stay in control</span>}
        />
        {on.length === 0 ? (
          <p className="tiny">
            Nothing switched on. Pick a ready-made set above — nothing happens to your money until you do.
          </p>
        ) : (
          <ul className="clean">
            {strategies
              .filter((s) => on.includes(s.id))
              .map((s) => {
                const account = deployTargets.find((t) => t.accountId === target);
                return (
                  <li key={s.id} className="row between">
                    <div className="row">
                      <span className="iconbox g">
                        <Icon name={s.icon} className="g" />
                      </span>
                      <div>
                        <b style={{ fontSize: 14 }}>{s.name}</b>
                        <div className="tiny">
                          {account ? `${account.provider} · ${account.label} · ` : ""}
                          {s.knobs
                            .map((k) => `${k.label.toLowerCase()} ${formatKnob(knobsById[s.id][k.id], k.unit)}`)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <span className="chip good">On</span>
                      <button className="btn sec sm" onClick={() => toggle(s.id)}>
                        Turn off
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>
    </div>
  );
}
