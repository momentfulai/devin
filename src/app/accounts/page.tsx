import { Icon } from "@/components/Icon";
import { Bar, Card, SectionTitle } from "@/components/ui";
import { accounts, money, totalValue } from "@/lib/portfolio";

export const metadata = { title: "Your accounts — Northstar" };

const providers = ["Vanguard", "Hargreaves Lansdown", "Freetrade", "Interactive Investor", "Trading 212", "AJ Bell"];

export default function AccountsPage() {
  return (
    <div className="stack">
      <div className="main-grid">
        <div className="stack">
          <Card>
            <SectionTitle
              icon="link"
              title="Connected accounts"
              aside={<span className="tiny">{money(totalValue)} in view</span>}
            />
            <ul className="clean">
              {accounts.map((a) => (
                <li key={a.id} className="holding-row">
                  <div className="tick" style={{ background: "var(--accent)" }}>
                    {a.provider.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <b>{a.provider}</b>
                    <div className="tiny">{a.label}</div>
                  </div>
                  <div className="hide-sm">
                    <Bar value={(a.value / totalValue) * 100} tone="accent" height={8} />
                    <span className="tiny">{((a.value / totalValue) * 100).toFixed(0)}% of everything</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b>{money(a.value)}</b>
                    <div className="tiny" style={{ color: a.changePct >= 0 ? "var(--good)" : "var(--bad)" }}>
                      {a.changePct >= 0 ? "+" : ""}
                      {a.changePct}%
                    </div>
                  </div>
                  <span className={`chip ${a.status === "live" ? "good" : a.status === "syncing" ? "info" : "warn"}`}>
                    {a.status === "live" ? `Synced ${a.lastSync}` : a.status === "syncing" ? "Syncing" : "Needs you"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle icon="plus" title="Add another" />
            <div className="grid g3">
              {providers.map((p) => (
                <button key={p} className="btn sec" style={{ justifyContent: "flex-start" }}>
                  <span className="dot" style={{ background: "var(--accent)" }} />
                  {p}
                </button>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 12 }}>
              Takes about a minute. You log in with your provider — we never see your password.
            </p>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <SectionTitle icon="lock" title="What we can and cannot do" />
            <ul className="clean">
              <li className="row">
                <Icon name="check" className="g" />
                <span style={{ fontSize: 13 }}>Read what you own and what it is worth</span>
              </li>
              <li className="row">
                <Icon name="check" className="g" />
                <span style={{ fontSize: 13 }}>Show you what to change, and why</span>
              </li>
              <li className="row">
                <Icon name="lock" className="r" />
                <span style={{ fontSize: 13 }}>Never move your money — only you can approve a trade</span>
              </li>
              <li className="row">
                <Icon name="lock" className="r" />
                <span style={{ fontSize: 13 }}>Never sell your data</span>
              </li>
            </ul>
          </Card>

          <Card>
            <SectionTitle icon="scale" title="How comfortable are you with a bad year?" />
            <p className="tiny">
              You told us you could live with losing a fifth of your money for a while. We check every
              suggestion against that line.
            </p>
            <div style={{ marginTop: 14 }}>
              <div className="between">
                <span className="tiny">Your line</span>
                <b style={{ fontSize: 13 }}>−20%</b>
              </div>
              <Bar value={44} tone="accent" height={12} />
              <div className="between" style={{ marginTop: 6 }}>
                <span className="tiny">Careful</span>
                <span className="tiny">Adventurous</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
