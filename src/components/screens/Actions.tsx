"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Bar, Card, SectionTitle } from "../ui";
import { MiniChart } from "../tradingview/widgets";
import { money, notDoing, recommendations } from "@/lib/portfolio";

export function Actions() {
  const [approved, setApproved] = useState<Record<string, "yes" | "no">>({});

  return (
    <div className="stack">
      <div className="between">
        <div>
          <h1>Three things worth doing</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Each one shows what changes, and what you give up by doing it. Nothing happens until you say so.
          </p>
        </div>
        <span className="chip info">
          <Icon name="lock" className="a" style={{ width: 13, height: 13 }} />
          You approve every trade
        </span>
      </div>

      {recommendations.map((r) => {
        const state = approved[r.id];
        const scale = Math.max(r.before, r.after) || 1;
        return (
          <Card key={r.id}>
            <div className="between" style={{ alignItems: "flex-start" }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <span className="iconbox p">
                  <Icon name="bolt" style={{ stroke: "var(--purple)" }} />
                </span>
                <div>
                  <h2 style={{ fontSize: 18 }}>{r.title}</h2>
                  <p className="muted" style={{ fontSize: 14, maxWidth: 620, marginTop: 4 }}>
                    {r.plainWhy}
                  </p>
                </div>
              </div>
              <span className="chip good">{r.confidence}% sure</span>
            </div>

            <div className="grid g3" style={{ marginTop: 18 }}>
              <div>
                <div className="tiny" style={{ marginBottom: 8 }}>
                  What changes
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div className="between">
                      <span className="tiny">Now</span>
                      <b style={{ fontSize: 13 }}>{r.beforeLabel}</b>
                    </div>
                    <Bar value={(r.before / scale) * 100} tone="bad" height={10} />
                  </div>
                  <div>
                    <div className="between">
                      <span className="tiny">After</span>
                      <b style={{ fontSize: 13 }}>{r.afterLabel}</b>
                    </div>
                    <Bar value={Math.max(4, (r.after / scale) * 100)} tone="good" height={10} />
                  </div>
                </div>
              </div>

              <div>
                <div className="tiny" style={{ marginBottom: 8 }}>
                  Your bad year
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div className="between">
                      <span className="tiny">Now</span>
                      <b style={{ fontSize: 13, color: "var(--bad)" }}>−{r.badYearBefore}%</b>
                    </div>
                    <Bar value={r.badYearBefore * 2.2} tone="bad" height={10} />
                  </div>
                  <div>
                    <div className="between">
                      <span className="tiny">After</span>
                      <b style={{ fontSize: 13 }}>−{r.badYearAfter}%</b>
                    </div>
                    <Bar value={r.badYearAfter * 2.2} tone="warn" height={10} />
                  </div>
                </div>
              </div>

              <div>
                <div className="tiny" style={{ marginBottom: 8 }}>
                  {r.tvSymbol ? "What it has done" : "What you give up"}
                </div>
                {r.tvSymbol ? (
                  <MiniChart symbol={r.tvSymbol} range="12M" height={82} />
                ) : (
                  <p style={{ fontSize: 13 }}>{r.upsideGivenUp}</p>
                )}
                <p className="tiny" style={{ marginTop: 8 }}>
                  {r.tvSymbol ? r.upsideGivenUp : `${money(r.moneyMoved)} moves in four steps`}
                </p>
              </div>
            </div>

            <hr />
            <div className="between">
              <span className="tiny">
                {money(r.moneyMoved)} moves · you can undo this any time
              </span>
              <div className="row">
                <button
                  className="btn sec sm"
                  onClick={() => setApproved((a) => ({ ...a, [r.id]: "no" }))}
                  disabled={state === "no"}
                >
                  Not now
                </button>
                <button
                  className="btn blue sm"
                  onClick={() => setApproved((a) => ({ ...a, [r.id]: "yes" }))}
                  disabled={state === "yes"}
                >
                  <Icon name="check" className="w" style={{ width: 14, height: 14 }} />
                  {state === "yes" ? "Approved" : "Approve"}
                </button>
              </div>
            </div>
          </Card>
        );
      })}

      <Card>
        <SectionTitle icon="shield" title="What we are deliberately not suggesting" />
        <ul className="clean">
          {notDoing.map((n) => (
            <li key={n.title} className="row">
              <Icon name="check" className="g" />
              <div>
                <b style={{ fontSize: 14 }}>{n.title}</b>
                <div className="tiny">{n.why}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
