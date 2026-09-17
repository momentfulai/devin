import { Icon } from "@/components/Icon";
import { Bar, Card, Kpi, SectionTitle } from "@/components/ui";
import {
  allocationOf,
  badYearLossPct,
  comfortLimitPct,
  holdings,
  money,
  overlap,
  scenarios,
  totalValue,
} from "@/lib/portfolio";

export const metadata = { title: "What's at risk — Northstar" };

const quality = [
  { name: "Nvidia", score: 86, note: "Makes real money, but priced for perfection" },
  { name: "Unilever", score: 74, note: "Dull, steady, pays you to wait" },
  { name: "Boohoo", score: 21, note: "Has burned cash three years running" },
];

export default function RiskPage() {
  const worst = Math.max(...scenarios.map((s) => Math.abs(s.impactPct)));
  const shares = holdings.filter((h) => h.kind !== "cash").sort((a, b) => b.value - a.value);
  const badYearPounds = (totalValue * badYearLossPct) / 100;
  const comfortPounds = (totalValue * comfortLimitPct) / 100;

  return (
    <div className="stack">
      <div className="grid g4">
        <Kpi icon="alert" tone="r" label="A bad year costs you" value={money(badYearPounds)} sub={`${badYearLossPct}% of everything`} />
        <Kpi icon="scale" tone="y" label="You said you could stomach" value={money(comfortPounds)} sub={`${comfortLimitPct}% — you are over the line`} />
        <Kpi icon="clock" tone="" label="Time to get back to level" value="2.4 years" sub="Based on how you are invested" />
        <Kpi icon="check" tone="g" label="Fixes that would close the gap" value="3" sub="None of them need new money" />
      </div>

      <div className="main-grid">
        <div className="stack">
          <Card>
            <SectionTitle icon="layers" title="You own the same companies three times over" />
            <p className="muted" style={{ fontSize: 14 }}>
              Your funds look different but hold a lot of the same shares. That is why one company can hurt
              you more than you think.
            </p>
            <div className="row" style={{ justifyContent: "center", margin: "18px 0" }}>
              <svg viewBox="0 0 320 170" style={{ width: "100%", maxWidth: 420, height: 170 }}>
                <circle cx="120" cy="85" r="62" fill="#1a63ff" fillOpacity="0.18" stroke="#1a63ff" strokeOpacity="0.5" />
                <circle cx="180" cy="85" r="62" fill="#8a63ff" fillOpacity="0.18" stroke="#8a63ff" strokeOpacity="0.5" />
                <circle cx="150" cy="120" r="48" fill="#17b3c3" fillOpacity="0.18" stroke="#17b3c3" strokeOpacity="0.5" />
                <text x="72" y="52" fontSize="11" fill="#565e6e">World tracker</text>
                <text x="205" y="52" fontSize="11" fill="#565e6e">US 500</text>
                <text x="128" y="166" fontSize="11" fill="#565e6e">Tech fund</text>
                <text x="150" y="92" fontSize="13" fontWeight="600" textAnchor="middle" fill="#0a0c11">
                  62% same
                </text>
              </svg>
            </div>
            <hr />
            <div style={{ display: "grid", gap: 12 }}>
              {overlap.repeated.map((r) => (
                <div key={r.name} style={{ display: "grid", gap: 6 }}>
                  <div className="between">
                    <span style={{ fontSize: 13 }}>
                      <b>{r.name}</b> <span className="tiny">turns up in {r.funds} of your funds</span>
                    </span>
                    <b style={{ fontSize: 13 }}>{r.pct}% of everything</b>
                  </div>
                  <Bar value={r.pct * 8} tone={r.pct > 8 ? "bad" : "warn"} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon="bolt"
              title="What your money quietly reacts to"
              aside={<span className="tiny">Change in everything you own</span>}
            />
            <div style={{ display: "grid", gap: 14 }}>
              {scenarios.map((s) => {
                const positive = s.impactPct > 0;
                const width = (Math.abs(s.impactPct) / worst) * 50;
                return (
                  <div key={s.id} style={{ display: "grid", gap: 4 }}>
                    <div className="between">
                      <span style={{ fontSize: 13 }}>{s.plainLabel}</span>
                      <b style={{ fontSize: 13, color: positive ? "var(--good)" : "var(--bad)" }}>
                        {money((totalValue * s.impactPct) / 100)}
                      </b>
                    </div>
                    <div style={{ position: "relative", height: 16 }}>
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--line)" }} />
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          height: 12,
                          borderRadius: 4,
                          background: positive ? "var(--good)" : "var(--bad)",
                          opacity: 0.85,
                          left: positive ? "50%" : `${50 - width}%`,
                          width: `${width}%`,
                        }}
                      />
                    </div>
                    <span className="tiny">{s.driver}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <SectionTitle icon="scale" title="Past your comfort line" />
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="between">
                  <span className="tiny">A bad year as it stands</span>
                  <b style={{ fontSize: 13, color: "var(--bad)" }}>−{badYearLossPct}%</b>
                </div>
                <Bar value={badYearLossPct * 2.2} tone="bad" height={12} />
              </div>
              <div>
                <div className="between">
                  <span className="tiny">The most you said you could take</span>
                  <b style={{ fontSize: 13 }}>−{comfortLimitPct}%</b>
                </div>
                <Bar value={comfortLimitPct * 2.2} tone="muted" height={12} />
              </div>
              <p className="muted" style={{ fontSize: 13 }}>
                The gap is {money(badYearPounds - comfortPounds)}. Three suggested changes close most of it
                without you adding a penny.
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle icon="target" title="How concentrated you are" />
            <div className="treemap">
              {shares.map((h) => {
                const span = Math.max(2, Math.round((allocationOf(h) / 100) * 30));
                return (
                  <div
                    key={h.symbol}
                    className="tile"
                    style={{ gridColumn: `span ${Math.min(12, span)}`, background: h.colour }}
                    title={`${h.name} ${allocationOf(h).toFixed(1)}%`}
                  >
                    {h.symbol}
                  </div>
                );
              })}
            </div>
            <p className="tiny" style={{ marginTop: 10 }}>
              Each block is a holding. The two biggest are nearly a third of everything you own.
            </p>
          </Card>

          <Card>
            <SectionTitle icon="spark" title="Are these good businesses?" />
            <div style={{ display: "grid", gap: 12 }}>
              {quality.map((q) => (
                <div key={q.name} style={{ display: "grid", gap: 6 }}>
                  <div className="between">
                    <b style={{ fontSize: 13 }}>{q.name}</b>
                    <span className="tiny">{q.score}/100</span>
                  </div>
                  <Bar value={q.score} tone={q.score > 70 ? "good" : q.score > 40 ? "warn" : "bad"} />
                  <span className="tiny">{q.note}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="row">
              <span className="iconbox">
                <Icon name="lock" className="a" />
              </span>
              <p className="tiny" style={{ flex: 1 }}>
                Read-only access. Northstar can never move your money — only you can approve a trade.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
