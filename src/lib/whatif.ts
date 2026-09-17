import {
  badYearLossPct,
  comfortLimitPct,
  feesPerYear,
  holdings,
  idleCash,
  totalValue,
  type Holding,
} from "./portfolio";

/**
 * "What if I bought this?" — pretend trades applied to today's portfolio at
 * today's prices. Nothing here touches a real account; the screen marks every
 * number it produces as a pretend one.
 */

export type Tradeable = {
  symbol: string;
  tvSymbol: string;
  name: string;
  colour: string;
  kind: Holding["kind"];
  region: string;
  /** Plain words for what the company or fund actually does. */
  plain: string;
  /** How much a bad year typically hurts this one, as a percentage fall. */
  badYearPct: number;
  /** Roughly how much of it already sits inside the funds the user owns. */
  alreadyOwnedPct?: number;
  feePct?: number;
};

export type WhatIfTrade = { symbol: string; action: "Buy" | "Sell"; amount: number };

export type WhatIfResult = {
  trades: WhatIfTrade[];
  positions: {
    symbol: string;
    name: string;
    colour: string;
    kind: Holding["kind"];
    before: number;
    after: number;
    isNew: boolean;
  }[];
  totalBefore: number;
  totalAfter: number;
  cashBefore: number;
  cashAfter: number;
  /** Positive when the pretend buys need more money than there is cash. */
  shortfall: number;
  mixBefore: { label: string; pct: number; colour: string }[];
  mixAfter: { label: string; pct: number; colour: string }[];
  biggestCompany: { name: string; before: number; after: number };
  badYear: { before: number; after: number; comfortLimit: number };
  feesPerYear: { before: number; after: number };
  /** Plain-English consequences, good and bad, of the pretend trades. */
  notes: { tone: "good" | "warn" | "bad"; text: string }[];
};

/** A small, recognisable universe: things people actually search for. */
export const tradeable: Tradeable[] = [
  { symbol: "NVDA", tvSymbol: "NASDAQ:NVDA", name: "Nvidia", colour: "#76b900", kind: "share", region: "US", plain: "Makes the chips almost every AI system runs on.", badYearPct: 55, alreadyOwnedPct: 5.4 },
  { symbol: "AAPL", tvSymbol: "NASDAQ:AAPL", name: "Apple", colour: "#111111", kind: "share", region: "US", plain: "Sells iPhones, and increasingly sells services on top of them.", badYearPct: 38, alreadyOwnedPct: 3.1 },
  { symbol: "MSFT", tvSymbol: "NASDAQ:MSFT", name: "Microsoft", colour: "#2f7cf6", kind: "share", region: "US", plain: "Office software and the cloud computers other companies rent.", badYearPct: 35, alreadyOwnedPct: 3.4 },
  { symbol: "TSLA", tvSymbol: "NASDAQ:TSLA", name: "Tesla", colour: "#e2504a", kind: "share", region: "US", plain: "Electric cars, with a share price that moves on stories as much as sales.", badYearPct: 65, alreadyOwnedPct: 1.1 },
  { symbol: "AMZN", tvSymbol: "NASDAQ:AMZN", name: "Amazon", colour: "#e2a33c", kind: "share", region: "US", plain: "The shop, plus the cloud business that earns most of the profit.", badYearPct: 45, alreadyOwnedPct: 2.2 },
  { symbol: "ULVR", tvSymbol: "LSE:ULVR", name: "Unilever", colour: "#1f36c7", kind: "share", region: "UK", plain: "Soap, ice cream, tea — things people buy in any weather.", badYearPct: 22, alreadyOwnedPct: 0.3 },
  { symbol: "SHEL", tvSymbol: "LSE:SHEL", name: "Shell", colour: "#d9483b", kind: "share", region: "UK", plain: "Oil and gas: does well exactly when energy bills hurt.", badYearPct: 35, alreadyOwnedPct: 0.4 },
  { symbol: "VWRL", tvSymbol: "AMEX:VT", name: "World tracker", colour: "#1a63ff", kind: "fund", region: "Global", plain: "A slice of roughly 3,700 companies in one purchase.", badYearPct: 30, feePct: 0.22 },
  { symbol: "VMID", tvSymbol: "LSE:VMID", name: "UK mid-size companies", colour: "#0aa06e", kind: "fund", region: "UK", plain: "250 medium British companies — the bit your portfolio barely owns.", badYearPct: 32, feePct: 0.1 },
  { symbol: "VFEM", tvSymbol: "AMEX:VWO", name: "Emerging markets", colour: "#8a63ff", kind: "fund", region: "Emerging", plain: "Companies in faster-growing, bumpier economies.", badYearPct: 38, feePct: 0.22 },
  { symbol: "GILT", tvSymbol: "LSE:IGLS", name: "Short UK bonds", colour: "#565e6e", kind: "bond", region: "UK", plain: "Lending to the government for a couple of years. Boring on purpose.", badYearPct: 5, feePct: 0.07 },
];

const kindLabels: Record<Holding["kind"], { label: string; colour: string }> = {
  share: { label: "Single companies", colour: "#8a63ff" },
  fund: { label: "Funds", colour: "#1a63ff" },
  bond: { label: "Bonds", colour: "#17b3c3" },
  cash: { label: "Cash", colour: "#98a0ae" },
};

const round = (n: number) => Number(n.toFixed(1));

function mixOf(values: Map<string, number>, kindOf: (symbol: string) => Holding["kind"]) {
  const total = [...values.values()].reduce((sum, v) => sum + v, 0) || 1;
  return (Object.keys(kindLabels) as Holding["kind"][])
    .map((kind) => {
      const value = [...values.entries()]
        .filter(([symbol]) => kindOf(symbol) === kind)
        .reduce((sum, [, v]) => sum + v, 0);
      return { label: kindLabels[kind].label, colour: kindLabels[kind].colour, pct: round((value / total) * 100) };
    })
    .filter((slice) => slice.pct > 0);
}

/** Applies pretend trades and describes the portfolio they leave behind. */
export function applyWhatIf(trades: WhatIfTrade[]): WhatIfResult {
  const before = new Map(holdings.map((h) => [h.symbol, h.value]));
  const after = new Map(before);
  const nameOf = new Map<string, Tradeable | Holding>([
    ...holdings.map((h) => [h.symbol, h] as const),
    ...tradeable.map((t) => [t.symbol, t] as const),
  ]);
  const kindOf = (symbol: string) => nameOf.get(symbol)?.kind ?? "share";

  let cash = before.get("CASH") ?? 0;
  let spent = 0;

  for (const trade of trades) {
    const held = after.get(trade.symbol) ?? 0;
    if (trade.action === "Buy") {
      after.set(trade.symbol, held + trade.amount);
      spent += trade.amount;
      cash -= trade.amount;
    } else {
      const sold = Math.min(held, trade.amount);
      after.set(trade.symbol, held - sold);
      cash += sold;
    }
  }
  after.set("CASH", Math.max(0, cash));
  const shortfall = Math.max(0, -cash);

  const symbols = [...new Set([...before.keys(), ...after.keys()])].filter((s) => s !== "CASH");
  const positions = symbols
    .map((symbol) => {
      const meta = nameOf.get(symbol);
      return {
        symbol,
        name: meta?.name ?? symbol,
        colour: meta?.colour ?? "#98a0ae",
        kind: kindOf(symbol),
        before: Math.round(before.get(symbol) ?? 0),
        after: Math.round(after.get(symbol) ?? 0),
        isNew: !before.has(symbol),
      };
    })
    .sort((a, b) => b.after - a.after);

  const totalAfter = [...after.values()].reduce((sum, v) => sum + v, 0);
  const sharesOnly = positions.filter((p) => p.kind === "share");
  const biggestAfter = sharesOnly.reduce(
    (top, p) => (p.after > top.after ? p : top),
    sharesOnly[0] ?? { name: "—", after: 0, before: 0 },
  );

  // Every holding drags the bad-year number towards its own bumpiness.
  const badYearOf = (symbol: string) => {
    const meta = tradeable.find((t) => t.symbol === symbol);
    if (meta) return meta.badYearPct;
    const kind = kindOf(symbol);
    return kind === "cash" ? 0 : kind === "bond" ? 5 : kind === "fund" ? 32 : 45;
  };
  const weighted = (values: Map<string, number>) => {
    const total = [...values.values()].reduce((sum, v) => sum + v, 0) || 1;
    return round([...values.entries()].reduce((sum, [symbol, v]) => sum + badYearOf(symbol) * (v / total), 0));
  };
  // Anchored on the portfolio's published bad-year number so the two screens agree.
  const anchor = badYearLossPct - weighted(before);
  const badYearAfter = round(Math.max(3, weighted(after) + anchor));

  const feeOf = (symbol: string) => (tradeable.find((t) => t.symbol === symbol)?.feePct ?? 0) / 100;
  const addedFees = Math.round(
    [...after.entries()].reduce((sum, [symbol, v]) => {
      const added = Math.max(0, v - (before.get(symbol) ?? 0));
      return sum + added * feeOf(symbol);
    }, 0),
  );

  const notes: WhatIfResult["notes"] = [];
  for (const trade of trades) {
    const meta = tradeable.find((t) => t.symbol === trade.symbol);
    if (!meta || trade.action !== "Buy") continue;
    if (meta.alreadyOwnedPct && meta.alreadyOwnedPct > 1) {
      notes.push({
        tone: "warn",
        text: `You already own ${meta.name} inside your funds — about ${meta.alreadyOwnedPct}% of everything. Buying more doubles up on the same company.`,
      });
    }
    const size = ((after.get(trade.symbol) ?? 0) / totalAfter) * 100;
    if (meta.kind === "share" && size > 10) {
      notes.push({
        tone: "bad",
        text: `${meta.name} would be ${round(size)}% of everything you own. One company that size decides how your year goes.`,
      });
    }
    if (meta.kind === "fund" && meta.region === "UK") {
      notes.push({ tone: "good", text: "Adds British medium-sized companies, the part of the market you barely own today." });
    }
  }
  if (shortfall > 0) {
    notes.push({
      tone: "bad",
      text: `You would need £${Math.round(shortfall).toLocaleString("en-GB")} more than the cash you have — you would have to sell something first.`,
    });
  }
  if (badYearAfter <= comfortLimitPct && badYearLossPct > comfortLimitPct) {
    notes.push({ tone: "good", text: `This would bring a bad year inside the ${comfortLimitPct}% you said you could live with.` });
  } else if (badYearAfter > badYearLossPct) {
    notes.push({
      tone: "warn",
      text: `A bad year would cost about ${badYearAfter}% instead of ${badYearLossPct}% — roughly £${Math.round(
        ((badYearAfter - badYearLossPct) / 100) * totalAfter,
      ).toLocaleString("en-GB")} more on paper.`,
    });
  }
  if (spent > 0 && spent <= idleCash) {
    notes.push({ tone: "good", text: "Paid for out of cash that is currently earning nothing." });
  }

  return {
    trades,
    positions,
    totalBefore: Math.round(totalValue),
    totalAfter: Math.round(totalAfter),
    cashBefore: Math.round(before.get("CASH") ?? 0),
    cashAfter: Math.round(after.get("CASH") ?? 0),
    shortfall: Math.round(shortfall),
    mixBefore: mixOf(before, kindOf),
    mixAfter: mixOf(after, kindOf),
    biggestCompany: {
      name: biggestAfter.name,
      before: round(((biggestAfter.before || 0) / totalValue) * 100),
      after: round(((biggestAfter.after || 0) / totalAfter) * 100),
    },
    badYear: { before: badYearLossPct, after: badYearAfter, comfortLimit: comfortLimitPct },
    feesPerYear: { before: feesPerYear, after: feesPerYear + addedFees },
    notes,
  };
}
