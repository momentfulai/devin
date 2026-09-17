import { notFound } from "next/navigation";
import { Bar, Card, LabelledBar, SectionTitle } from "@/components/ui";
import { AdvancedChart, Fundamentals, SymbolInfo, TechnicalGauge } from "@/components/tradingview/widgets";
import { CompanyPicker } from "@/components/CompanyPicker";
import { allocationOf, companies, holdings, money, opportunities, pct } from "@/lib/portfolio";
import { tradeable } from "@/lib/whatif";

function resolve(symbol: string) {
  const upper = symbol.toUpperCase();
  const facts = companies[upper];
  if (facts) return { tvSymbol: facts.tvSymbol, name: facts.name, facts };
  const held = holdings.find((h) => h.symbol.toUpperCase() === upper);
  if (held?.tvSymbol) return { tvSymbol: held.tvSymbol, name: held.name, facts: null };
  const watched = tradeable.find((t) => t.symbol.toUpperCase() === upper);
  if (watched) return { tvSymbol: watched.tvSymbol, name: watched.name, facts: null };
  const idea = opportunities.find((o) => o.tvSymbol.split(":")[1].toUpperCase() === upper);
  if (idea) return { tvSymbol: idea.tvSymbol, name: idea.title, facts: null };
  return null;
}

export default async function CompanyPage({ params }: PageProps<"/company/[symbol]">) {
  const { symbol } = await params;
  const found = resolve(symbol);
  if (!found) notFound();
  const { tvSymbol, name, facts } = found;
  const held = holdings.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
  const watched = tradeable.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());

  return (
    <div className="stack">
      <CompanyPicker active={symbol} />

      <Card>
        <SectionTitle icon="layers" title={held ? `Your ${name}` : `You don't own ${name}`} />
        {held ? (
          <div className="grid g3">
            <div>
              <div className="tiny">What it is worth</div>
              <b style={{ fontSize: 20 }}>{money(held.value)}</b>
              <div className="tiny">{allocationOf(held).toFixed(1)}% of everything you own</div>
            </div>
            <div>
              <div className="tiny">Since you bought</div>
              <b style={{ fontSize: 20 }}>{money(held.value - held.costBasis)}</b>
              <div className="tiny">
                {pct(held.returnPct)} over {held.returnWindow}
              </div>
            </div>
            <div>
              <div className="tiny">Where it lives</div>
              <b style={{ fontSize: 20 }}>{held.account}</b>
              <div className="tiny">{held.note ?? "Nothing needs doing here today."}</div>
            </div>
          </div>
        ) : (
          <div className="grid g2">
            <p className="muted" style={{ fontSize: 14 }}>
              {watched?.plain ?? "Not in your accounts today."}
            </p>
            <p className="tiny">
              Try it for pretend on the Future tab: buy an amount and see what it would do to your mix and to a
              bad year, without anything real happening.
            </p>
          </div>
        )}
      </Card>

      <Card pad={false}>
        <SymbolInfo symbol={tvSymbol} />
      </Card>

      <div className="main-grid">
        <div className="stack">
          <Card pad={false}>
            <AdvancedChart symbol={tvSymbol} />
          </Card>

          {facts && (
            <Card>
              <SectionTitle icon="spark" title="What the numbers say, in English" />
              <div className="grid g2">
                <LabelledBar
                  label="Sales growing"
                  plain={`Selling ${facts.salesGrowthPct}% more than a year ago`}
                  value={facts.salesGrowthPct}
                  tone="good"
                />
                <LabelledBar
                  label="Profit per £1 of sales"
                  plain={`${facts.profitPerPound}p kept, against ${facts.peerProfitPerPound}p for similar firms`}
                  value={facts.profitPerPound}
                  tone="good"
                />
                <LabelledBar
                  label="Price against profits"
                  plain={`You pay £${facts.priceVsProfits} for £1 of yearly profit — the market average is £${facts.marketPriceVsProfits}`}
                  value={Math.min(100, facts.priceVsProfits * 2)}
                  tone="warn"
                />
                <LabelledBar
                  label="How much of you it is"
                  plain={`${facts.exposure.direct}% held directly, another ${facts.exposure.hidden}% inside your funds`}
                  value={(facts.exposure.direct + facts.exposure.hidden) * 6}
                  tone="bad"
                />
              </div>
            </Card>
          )}

          <Card pad={false}>
            <Fundamentals symbol={tvSymbol} />
          </Card>
        </div>

        <div className="stack">
          {facts && (
            <>
              <Card>
                <SectionTitle icon="target" title="What has to be true for this to work" />
                <div style={{ display: "grid", gap: 12 }}>
                  {facts.mustBeTrue.map((m) => (
                    <div key={m.claim} style={{ display: "grid", gap: 5 }}>
                      <div className="between">
                        <span style={{ fontSize: 13 }}>{m.claim}</span>
                        <b style={{ fontSize: 12 }}>{m.confidence}%</b>
                      </div>
                      <Bar value={m.confidence} tone={m.confidence > 60 ? "good" : m.confidence > 40 ? "warn" : "bad"} height={6} />
                    </div>
                  ))}
                </div>
                <p className="tiny" style={{ marginTop: 10 }}>
                  Our confidence that each one holds. If the bottom one breaks, the price has a long way to
                  fall.
                </p>
              </Card>

              <Card>
                <SectionTitle icon="layers" title="Who pays their bills" />
                <div style={{ display: "grid", gap: 10 }}>
                  {facts.customerConcentration.map((c) => (
                    <div key={c.name} className="row">
                      <span style={{ width: 62, fontSize: 13 }}>{c.name}</span>
                      <div style={{ flex: 1 }}>
                        <Bar value={c.pct * 5} tone="accent" height={10} />
                      </div>
                      <b style={{ fontSize: 12, width: 34, textAlign: "right" }}>{c.pct}%</b>
                    </div>
                  ))}
                </div>
                <p className="tiny" style={{ marginTop: 10 }}>
                  Four customers are nearly half of sales. If one slows its spending, {name} feels it fast.
                </p>
              </Card>

              <Card>
                <SectionTitle icon="scale" title="Against the average big company" />
                <div style={{ display: "grid", gap: 12 }}>
                  {facts.vsIndex.map((v) => (
                    <div key={v.label} style={{ display: "grid", gap: 5 }}>
                      <div className="between">
                        <span className="tiny">{v.label}</span>
                        <span className="tiny">
                          {v.you} vs {v.index}
                        </span>
                      </div>
                      <Bar value={v.you} tone={v.you >= v.index ? "good" : "bad"} height={6} />
                      <Bar value={v.index} tone="muted" height={4} />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          <Card pad={false}>
            <TechnicalGauge symbol={tvSymbol} />
          </Card>
        </div>
      </div>
    </div>
  );
}
