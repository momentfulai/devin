"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Bar, Card, Donut, Legend, SectionTitle } from "../ui";
import { FanChart } from "../charts/FanChart";
import { MiniChart } from "../tradingview/widgets";
import { comfortLimitPct, idleCash, money, totalValue } from "@/lib/portfolio";
import { projectFuture } from "@/lib/future";
import { applyWhatIf, tradeable, type WhatIfTrade } from "@/lib/whatif";

const horizons = [5, 10, 20, 30];

export function Future() {
  const [years, setYears] = useState(20);
  const [monthly, setMonthly] = useState(250);
  const [picked, setPicked] = useState(tradeable[0].symbol);
  const [amount, setAmount] = useState(2000);
  const [trades, setTrades] = useState<WhatIfTrade[]>([]);

  const stock = tradeable.find((t) => t.symbol === picked) ?? tradeable[0];
  const pretending = trades.length > 0;
  const whatIf = applyWhatIf(trades);

  const base = projectFuture({ years, monthlyContribution: monthly });
  const after = pretending
    ? projectFuture({
        years,
        monthlyContribution: monthly,
        startValue: whatIf.totalAfter,
        badYearPct: whatIf.badYear.after,
      })
    : undefined;

  const moved = whatIf.positions.filter((p) => p.after !== p.before);

  return (
    <div className={`stack ${pretending ? "pretending" : ""}`}>
      <div className="between">
        <div>
          <h1>Where this could end up</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Thousands of made-up futures played out on your own money — the good ones, the bad ones, and the middle.
            Nobody can predict markets, so read this as a range, not a promise.
          </p>
        </div>
        {pretending && (
          <span className="chip pretend">
            <Icon name="spark" className="y" style={{ width: 13, height: 13 }} />
            Pretend trades on
          </span>
        )}
      </div>

      <Card>
        <SectionTitle
          icon="chart"
          title={`Your money over the next ${years} years`}
          aside={
            <span className="tiny">
              Solid: today&apos;s portfolio{pretending ? " · Dashed amber: with your pretend trades" : ""}
            </span>
          }
        />
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="seg wrap-sm">
            {horizons.map((h) => (
              <button key={h} className={h === years ? "on" : ""} onClick={() => setYears(h)}>
                {h} years
              </button>
            ))}
          </div>
          <label style={{ display: "grid", gap: 4, minWidth: 220 }}>
            <span className="between">
              <span className="tiny">Money you add each month</span>
              <b style={{ fontSize: 13 }}>{money(monthly)}</b>
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
            />
          </label>
        </div>

        <FanChart bands={base.bands} compare={after?.bands} />

        <div className="grid g3" style={{ marginTop: 14 }}>
          <div className="outcome bad">
            <span className="iconbox r">
              <Icon name="down" className="r" />
            </span>
            <div>
              <div className="tiny">If things go badly</div>
              <b style={{ fontSize: 20 }}>{money(base.bad)}</b>
              <div className="tiny">Worse than this in about 1 in 10 futures</div>
            </div>
          </div>
          <div className="outcome average">
            <span className="iconbox">
              <Icon name="scale" className="a" />
            </span>
            <div>
              <div className="tiny">Middle of the road</div>
              <b style={{ fontSize: 20 }}>{money(base.average)}</b>
              <div className="tiny">Half of the futures land above this</div>
            </div>
          </div>
          <div className="outcome good">
            <span className="iconbox g">
              <Icon name="up" className="g" />
            </span>
            <div>
              <div className="tiny">If things go well</div>
              <b style={{ fontSize: 20 }}>{money(base.good)}</b>
              <div className="tiny">Better than this in about 1 in 10 futures</div>
            </div>
          </div>
        </div>

        <hr />
        <div className="grid g3">
          <div>
            <div className="between">
              <span className="tiny">You would have put in</span>
              <b style={{ fontSize: 13 }}>{money(base.paidIn)}</b>
            </div>
            <Bar value={Math.min(100, (base.paidIn / base.average) * 100)} tone="muted" height={8} />
            <span className="tiny">{money(totalValue)} today plus {money(monthly)} a month</span>
          </div>
          <div>
            <div className="between">
              <span className="tiny">Chance of ending with more than you put in</span>
              <b style={{ fontSize: 13 }}>{base.chanceOfMoreThanPaidIn}%</b>
            </div>
            <Bar value={base.chanceOfMoreThanPaidIn} tone="good" height={8} />
            <span className="tiny">About {base.chanceOfDoubling} in 100 futures at least double it</span>
          </div>
          <div>
            <div className="between">
              <span className="tiny">Typical worst drop on the way</span>
              <b style={{ fontSize: 13 }}>−{base.typicalWorstDipPct}%</b>
            </div>
            <Bar value={base.typicalWorstDipPct} tone="warn" height={8} />
            <span className="tiny">
              Roughly {money(Math.round((base.typicalWorstDipPct / 100) * base.average))} off the top at some point
            </span>
          </div>
        </div>

        {after && (
          <>
            <hr />
            <div className="pretend-note">
              <Icon name="spark" className="y" />
              <div>
                <b style={{ fontSize: 14 }}>With your pretend trades</b>
                <div className="tiny">
                  Middle outcome {money(after.average)} instead of {money(base.average)}, bad case{" "}
                  {money(after.bad)} instead of {money(base.bad)}. None of this has happened — clear the trades below to
                  go back.
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className={pretending ? "whatif" : ""}>
        <SectionTitle
          icon="search"
          title="What if I bought this?"
          aside={<span className="chip pretend">Nothing here is real</span>}
        />
        <div className="grid g2">
          <div>
            <div className="seg wrap-sm" style={{ marginBottom: 12 }}>
              {tradeable.map((t) => (
                <button key={t.symbol} className={t.symbol === picked ? "on" : ""} onClick={() => setPicked(t.symbol)}>
                  {t.name}
                </button>
              ))}
            </div>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <b style={{ fontSize: 16 }}>{stock.name}</b>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {stock.plain}
                </p>
                <div className="tiny" style={{ marginTop: 6 }}>
                  A bad year has cost this about {stock.badYearPct}%
                  {stock.alreadyOwnedPct ? ` · you already own ${stock.alreadyOwnedPct}% of it through funds` : ""}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <MiniChart symbol={stock.tvSymbol} range="12M" height={110} />
            </div>
            <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
              <span className="between">
                <span style={{ fontSize: 14 }}>How much</span>
                <b style={{ fontSize: 14 }}>{money(amount)}</b>
              </span>
              <input
                type="range"
                min={250}
                max={10000}
                step={250}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <span className="tiny">You have {money(idleCash)} in cash doing nothing today</span>
            </label>
            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="btn blue sm"
                onClick={() => setTrades((all) => [...all, { symbol: stock.symbol, action: "Buy", amount }])}
              >
                <Icon name="plus" className="w" style={{ width: 14, height: 14 }} />
                Pretend to buy
              </button>
              <button
                className="btn sec sm"
                onClick={() => setTrades((all) => [...all, { symbol: stock.symbol, action: "Sell", amount }])}
              >
                Pretend to sell
              </button>
              {pretending && (
                <button className="btn sec sm" onClick={() => setTrades([])}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            {!pretending ? (
              <p className="tiny">
                Add a pretend trade and this side fills in: what your mix becomes, what a bad year would cost, and
                whether you would be buying something you already own.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <ul className="clean">
                  {trades.map((t, i) => {
                    const meta = tradeable.find((x) => x.symbol === t.symbol);
                    return (
                      <li key={`${t.symbol}-${t.action}-${i}`} className="row between">
                        <span style={{ fontSize: 13 }}>
                          <span className={`chip ${t.action === "Sell" ? "warn" : "good"}`}>{t.action}</span>{" "}
                          {meta?.name ?? t.symbol} · {money(t.amount)}
                        </span>
                        <button
                          className="btn sec sm"
                          onClick={() => setTrades((all) => all.filter((_, index) => index !== i))}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="row">
                  <Donut
                    slices={whatIf.mixBefore}
                    size={104}
                    centre={{ top: money(whatIf.totalBefore), bottom: "today" }}
                  />
                  <Icon name="up" style={{ width: 16, height: 16, transform: "rotate(90deg)" }} />
                  <Donut
                    slices={whatIf.mixAfter}
                    size={104}
                    centre={{ top: money(whatIf.totalAfter), bottom: "pretend" }}
                  />
                  <Legend
                    items={whatIf.mixAfter.map((s) => ({ label: s.label, colour: s.colour, value: `${s.pct}%` }))}
                  />
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div className="between">
                    <span className="tiny">Biggest single company ({whatIf.biggestCompany.name})</span>
                    <span style={{ fontSize: 13 }}>
                      <span className="muted">{whatIf.biggestCompany.before}%</span> →{" "}
                      <b>{whatIf.biggestCompany.after}%</b>
                    </span>
                  </div>
                  <div className="between">
                    <span className="tiny">What a bad year would cost</span>
                    <span style={{ fontSize: 13 }}>
                      <span className="muted">−{whatIf.badYear.before}%</span> →{" "}
                      <b
                        style={{
                          color: whatIf.badYear.after <= comfortLimitPct ? "var(--good)" : "var(--warn)",
                        }}
                      >
                        −{whatIf.badYear.after}%
                      </b>
                    </span>
                  </div>
                  <Bar value={whatIf.badYear.after * 2.2} tone={whatIf.badYear.after <= comfortLimitPct ? "good" : "warn"} height={8} />
                  <div className="between">
                    <span className="tiny">Cash left</span>
                    <span style={{ fontSize: 13 }}>
                      <span className="muted">{money(whatIf.cashBefore)}</span> → <b>{money(whatIf.cashAfter)}</b>
                    </span>
                  </div>
                  <div className="between">
                    <span className="tiny">Yearly costs</span>
                    <span style={{ fontSize: 13 }}>
                      <span className="muted">{money(whatIf.feesPerYear.before)}</span> →{" "}
                      <b>{money(whatIf.feesPerYear.after)}</b>
                    </span>
                  </div>
                </div>

                <ul className="clean">
                  {whatIf.notes.map((n) => (
                    <li key={n.text} className="row">
                      <Icon
                        name={n.tone === "good" ? "check" : "alert"}
                        className={n.tone === "good" ? "g" : n.tone === "warn" ? "y" : "r"}
                      />
                      <span className="tiny">{n.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {moved.length > 0 && (
          <>
            <hr />
            <div className="tiny" style={{ marginBottom: 8 }}>
              What you would own afterwards
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {moved.map((p) => {
                const scale = Math.max(p.before, p.after) || 1;
                const grew = p.after > p.before;
                return (
                  <div key={p.symbol}>
                    <div className="between">
                      <span style={{ fontSize: 13 }}>
                        <span className="dot" style={{ background: p.colour }} /> {p.name}
                        {p.isNew && <span className="chip pretend">New</span>}
                      </span>
                      <span style={{ fontSize: 13 }}>
                        <span className="muted">{money(p.before)}</span> → <b>{money(p.after)}</b>
                      </span>
                    </div>
                    <Bar value={(p.before / scale) * 100} tone="muted" height={6} />
                    <Bar value={(p.after / scale) * 100} tone={grew ? "good" : "warn"} height={6} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
