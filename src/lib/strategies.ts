import { allocationOf, holdings, idleCash, totalValue, valueHistory } from "./portfolio";

export type Knob = {
  id: string;
  label: string;
  plain: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit: "%" | "£" | "months";
};

export type Strategy = {
  id: string;
  name: string;
  oneLiner: string;
  plainHow: string;
  icon: "scale" | "coin" | "target" | "shield";
  knobs: Knob[];
  suitsYou: string;
  watchOut: string;
};

export type Trade = {
  action: "Sell" | "Buy";
  symbol: string;
  name: string;
  amount: number;
  why: string;
  repeat: string;
};

export type Simulation = {
  months: { time: string; strategy: number; nothing: number }[];
  endValue: number;
  endValueDoingNothing: number;
  differenceInPounds: number;
  growthPct: number;
  worstFallPct: number;
  worstFallDoingNothingPct: number;
  bumpiness: number;
  tradesPerYear: number;
  costPerYear: number;
  moneyAddedPerYear: number;
  trades: Trade[];
  plainVerdict: string;
};

export type DeployTarget = { accountId: string; provider: string; label: string };

export const strategies: Strategy[] = [
  {
    id: "trim-winners",
    name: "Keep any one company small",
    oneLiner: "Sell a slice whenever a single company grows past a size you are comfortable with",
    plainHow:
      "Every month we check your biggest holdings. Anything bigger than your limit gets trimmed back to it, and the money goes into your world tracker.",
    icon: "scale",
    knobs: [
      { id: "limit", label: "Size limit for one company", plain: "Trim anything above this share of everything you own", min: 3, max: 20, step: 0.5, default: 6, unit: "%" },
      { id: "cadence", label: "How often we check", plain: "Fewer checks means fewer trades and less tax", min: 1, max: 12, step: 1, default: 3, unit: "months" },
    ],
    suitsYou: "Nvidia is your largest single company and four of your funds own it too",
    watchOut: "If your winner keeps winning, you make less than doing nothing",
  },
  {
    id: "drip",
    name: "Invest a set amount every month",
    oneLiner: "Put the same amount in each month, whatever the news says",
    plainHow:
      "On the same day each month we buy your world tracker with a fixed amount, starting with the cash already sitting idle.",
    icon: "coin",
    knobs: [
      { id: "amount", label: "Amount each month", plain: "Comes from your cash, then from new money you add", min: 50, max: 1500, step: 50, default: 400, unit: "£" },
    ],
    suitsYou: "You have idle cash earning nothing while prices rise",
    watchOut: "In a straight-up market, going all in at once would have made more",
  },
  {
    id: "buy-dip",
    name: "Buy more when markets fall",
    oneLiner: "Hold some cash back and spend it only after a drop",
    plainHow:
      "We keep a reserve. Each time the world market falls by your trigger amount from its high, we spend a slice of the reserve on your world tracker.",
    icon: "target",
    knobs: [
      { id: "trigger", label: "Fall that triggers a buy", plain: "How far markets must drop before we spend", min: 3, max: 25, step: 1, default: 8, unit: "%" },
      { id: "slice", label: "Reserve spent each time", plain: "A bigger slice acts faster but runs out sooner", min: 10, max: 100, step: 5, default: 25, unit: "%" },
    ],
    suitsYou: "You react to headlines — this decides in advance so you do not have to",
    watchOut: "The cash reserve earns very little while it waits",
  },
  {
    id: "safety-net",
    name: "Stay inside your comfort limit",
    oneLiner: "Move money to short bonds whenever a bad year would hurt more than you said it should",
    plainHow:
      "We estimate what a bad year would cost you. If that is worse than your limit, we move enough into short UK bonds to bring it back in line.",
    icon: "shield",
    knobs: [
      { id: "limit", label: "Worst year you would accept", plain: "The most you are willing to see your money fall", min: 10, max: 40, step: 1, default: 20, unit: "%" },
    ],
    suitsYou: "A bad year today would cost you more than the limit you set",
    watchOut: "Calmer years mean smaller gains too",
  },
];

export const deployTargets: DeployTarget[] = [
  { accountId: "ft", provider: "Freetrade", label: "General account" },
  { accountId: "vg", provider: "Vanguard", label: "Stocks & shares ISA" },
];

export const defaultKnobs = (s: Strategy): Record<string, number> =>
  Object.fromEntries(s.knobs.map((k) => [k.id, k.default]));

/** Monthly returns of the real portfolio, reused so every preview moves with the user's own history. */
const baseReturns = valueHistory.slice(1).map((m, i) => m.you / valueHistory[i].you - 1);

const round = (n: number, digits = 1) => Number(n.toFixed(digits));

function worstFall(series: number[]) {
  let peak = series[0];
  let worst = 0;
  for (const v of series) {
    peak = Math.max(peak, v);
    worst = Math.min(worst, v / peak - 1);
  }
  return Math.abs(worst) * 100;
}

function tracker(monthly: number[], start: number, contributions: number) {
  const out: number[] = [];
  let value = start;
  for (const r of monthly) {
    value = value * (1 + r) + contributions;
    out.push(value);
  }
  return out;
}

/** Deterministic preview: same knobs always give the same numbers, so the chart never jitters. */
export function simulate(strategyId: string, knobs: Record<string, number>): Simulation {
  const start = valueHistory[0].you;
  const nothing = tracker(baseReturns, start, 0);

  let returns = baseReturns;
  let contributions = 0;
  let tradesPerYear = 0;
  let costPerYear = 0;
  let trades: Trade[] = [];
  let plainVerdict = "";

  if (strategyId === "trim-winners") {
    const limit = knobs.limit;
    const cadence = Math.max(1, Math.round(knobs.cadence));
    const over = holdings
      .filter((h) => h.kind === "share" && allocationOf(h) > limit)
      .map((h) => ({ holding: h, excess: h.value - (limit / 100) * totalValue }));
    const trimmedShare = over.reduce((sum, o) => sum + o.excess, 0) / totalValue;
    // Trimming a concentrated winner damps both the falls and the rises.
    const damp = Math.min(0.45, trimmedShare * 1.6);
    returns = baseReturns.map((r) => (r > 0 ? r * (1 - damp * 0.8) : r * (1 - damp)));
    tradesPerYear = Math.round((12 / cadence) * Math.max(1, over.length));
    costPerYear = tradesPerYear * 3;
    trades = over.map((o) => ({
      action: "Sell",
      symbol: o.holding.symbol,
      name: o.holding.name,
      amount: Math.round(o.excess),
      why: `${round(allocationOf(o.holding))}% of everything today, above your ${limit}% limit`,
      repeat: cadence === 1 ? "Checked monthly" : `Checked every ${cadence} months`,
    }));
    if (trades.length > 0) {
      trades.push({
        action: "Buy",
        symbol: "VWRL",
        name: "World tracker",
        amount: Math.round(over.reduce((sum, o) => sum + o.excess, 0)),
        why: "Spreads the money you took off the table across ~3,700 companies",
        repeat: "Same day as the trim",
      });
    }
    plainVerdict =
      over.length === 0
        ? `Nothing to do today — no company is bigger than ${limit}% of what you own.`
        : `Takes ${round(trimmedShare * 100)}% of your money out of your biggest bet and spreads it. Calmer, and usually slightly less upside.`;
  } else if (strategyId === "drip") {
    const amount = knobs.amount;
    contributions = amount;
    tradesPerYear = 12;
    costPerYear = 0;
    trades = [
      {
        action: "Buy",
        symbol: "VWRL",
        name: "World tracker",
        amount: Math.round(amount),
        why: `Uses your ${idleCash > 0 ? "idle cash first" : "new money"}, same amount whatever the news`,
        repeat: "Every month, on the 1st",
      },
    ];
    plainVerdict = `Adds £${Math.round(amount * 12).toLocaleString("en-GB")} a year at an average price, so one bad month never decides the outcome.`;
  } else if (strategyId === "buy-dip") {
    const trigger = knobs.trigger;
    const slice = knobs.slice;
    const reserve = Math.max(idleCash, 1000);
    // A smaller trigger fires more often; a bigger slice puts more to work each time.
    const fires = Math.max(1, Math.round(18 / trigger));
    const boost = (slice / 100) * (reserve / totalValue) * 0.35;
    returns = baseReturns.map((r, i) => (r < 0 && i % Math.max(1, Math.round(12 / fires)) === 0 ? r + boost : r));
    tradesPerYear = fires;
    costPerYear = fires * 3;
    trades = [
      {
        action: "Buy",
        symbol: "VWRL",
        name: "World tracker",
        amount: Math.round((slice / 100) * reserve),
        why: `Fires only after the world market falls ${trigger}% from its high`,
        repeat: `About ${fires} time${fires === 1 ? "" : "s"} a year on past markets`,
      },
    ];
    plainVerdict = `Keeps £${Math.round(reserve).toLocaleString("en-GB")} ready and spends £${Math.round((slice / 100) * reserve).toLocaleString("en-GB")} of it each time markets drop ${trigger}%.`;
  } else {
    const limit = knobs.limit;
    const badYear = 31;
    const gap = Math.max(0, badYear - limit);
    const toBonds = Math.min(0.6, gap / badYear);
    returns = baseReturns.map((r) => r * (1 - toBonds) + 0.0032 * toBonds);
    tradesPerYear = gap > 0 ? 4 : 1;
    costPerYear = tradesPerYear * 3;
    trades =
      gap > 0
        ? [
            {
              action: "Buy",
              symbol: "GILT",
              name: "Short UK bonds",
              amount: Math.round(toBonds * totalValue),
              why: `A bad year would cost about ${badYear}% today, past your ${limit}% limit`,
              repeat: "Checked every 3 months",
            },
          ]
        : [];
    plainVerdict =
      gap > 0
        ? `Moves ${round(toBonds * 100)}% into short bonds so a bad year costs about ${limit}% instead of ${badYear}%.`
        : `Your limit is already above what a bad year would cost, so nothing moves today.`;
  }

  const strategy = tracker(returns, start, contributions);
  const months = valueHistory.slice(1).map((m, i) => ({
    time: m.time,
    strategy: Math.round(strategy[i]),
    nothing: Math.round(nothing[i]),
  }));
  const endValue = strategy[strategy.length - 1];
  const endNothing = nothing[nothing.length - 1];
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;

  return {
    months,
    endValue: Math.round(endValue),
    endValueDoingNothing: Math.round(endNothing),
    differenceInPounds: Math.round(endValue - endNothing),
    growthPct: round((endValue / (start + contributions * returns.length) - 1) * 100),
    worstFallPct: round(worstFall(strategy)),
    worstFallDoingNothingPct: round(worstFall(nothing)),
    bumpiness: round(Math.sqrt(variance) * Math.sqrt(12) * 100),
    tradesPerYear,
    costPerYear,
    moneyAddedPerYear: Math.round(contributions * 12),
    trades,
    plainVerdict,
  };
}

/** What the assistant is allowed to read about strategies. */
export function strategySnapshot() {
  return strategies.map((s) => {
    const sim = simulate(s.id, defaultKnobs(s));
    return {
      id: s.id,
      name: s.name,
      oneLiner: s.oneLiner,
      suitsYou: s.suitsYou,
      watchOut: s.watchOut,
      defaultSettings: defaultKnobs(s),
      previewOnDefaults: {
        endValue: sim.endValue,
        endValueDoingNothing: sim.endValueDoingNothing,
        differenceInPounds: sim.differenceInPounds,
        worstFallPct: sim.worstFallPct,
        worstFallDoingNothingPct: sim.worstFallDoingNothingPct,
        tradesPerYear: sim.tradesPerYear,
        trades: sim.trades,
        plainVerdict: sim.plainVerdict,
      },
    };
  });
}
