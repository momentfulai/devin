import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Bar, Card, SectionTitle } from "@/components/ui";
import { MiniChart } from "@/components/tradingview/widgets";
import { opportunities } from "@/lib/portfolio";

export const metadata = { title: "Ideas — Northstar" };

export default function IdeasPage() {
  return (
    <div className="stack">
      <div className="between">
        <div>
          <h1>Gaps worth filling</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Found by comparing what you own with the whole market — not by chasing what went up last month.
          </p>
        </div>
        <span className="chip info">
          <Icon name="search" className="a" style={{ width: 13, height: 13 }} />
          Refreshed this morning
        </span>
      </div>

      <div className="grid g3">
        {opportunities.map((o) => (
          <Card key={o.id}>
            <div className="between">
              <span className={`chip ${o.chipTone}`}>{o.chip}</span>
              <span className="tiny">{o.tvSymbol.split(":")[1]}</span>
            </div>
            <h3 style={{ marginTop: 12, fontSize: 16 }}>{o.title}</h3>
            <p className="tiny" style={{ marginTop: 4 }}>
              {o.subtitle}
            </p>

            <div style={{ margin: "14px 0" }}>
              <MiniChart symbol={o.tvSymbol} range="12M" height={96} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {o.bars.map((b) => (
                <div key={b.label} style={{ display: "grid", gap: 5 }}>
                  <div className="between">
                    <span className="tiny">{b.label}</span>
                    <b style={{ fontSize: 12 }}>{b.value}</b>
                  </div>
                  <Bar value={b.value} tone={b.tone} height={6} />
                </div>
              ))}
            </div>

            <hr />
            <ul className="clean">
              {o.reasons.map((r) => (
                <li key={r} className="row" style={{ padding: "7px 0", borderTop: 0 }}>
                  <Icon name="check" className="g" style={{ width: 14, height: 14, flex: "none" }} />
                  <span style={{ fontSize: 13 }}>{r}</span>
                </li>
              ))}
            </ul>

            <Link className="btn sec sm" href={`/company/${o.tvSymbol.split(":")[1]}`}>
              Look closer
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle icon="alert" title="How to read these" />
        <div className="grid g3">
          <p className="tiny">
            <b style={{ color: "var(--ink)" }}>Fills a gap you have</b> — how much of the world you are
            missing that this covers.
          </p>
          <p className="tiny">
            <b style={{ color: "var(--ink)" }}>Moves with what you own</b> — lower is better. A high number
            means you are buying more of the same.
          </p>
          <p className="tiny">
            <b style={{ color: "var(--ink)" }}>Bumpiness</b> — how wild the ride has been. Higher means
            bigger swings, up and down.
          </p>
        </div>
      </Card>
    </div>
  );
}
