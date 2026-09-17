export type Holding = {
  symbol: string;
  tvSymbol: string;
  name: string;
  colour: string;
  value: number;
  costBasis: number;
  account: string;
  kind: "share" | "fund" | "bond" | "cash";
  region: string;
  returnPct: number;
  returnWindow: string;
  flag?: { tone: "good" | "warn" | "bad"; label: string };
  /** Plain-language note shown under the holding. */
  note?: string;
};

export type Account = {
  id: string;
  provider: string;
  label: string;
  value: number;
  changePct: number;
  status: "live" | "syncing" | "action";
  lastSync: string;
  /** False while an account's holdings are not synced, so its value is left out of every total. */
  counted: boolean;
};

export type Scenario = {
  id: string;
  label: string;
  plainLabel: string;
  impactPct: number;
  driver: string;
};

export type Opportunity = {
  id: string;
  tvSymbol: string;
  title: string;
  subtitle: string;
  chipTone: "good" | "warn" | "info";
  chip: string;
  reasons: string[];
  bars: { label: string; value: number; tone: "good" | "warn" | "bad" }[];
};

export type Recommendation = {
  id: string;
  title: string;
  plainWhy: string;
  symbol?: string;
  tvSymbol?: string;
  before: number;
  after: number;
  beforeLabel: string;
  afterLabel: string;
  badYearBefore: number;
  badYearAfter: number;
  upsideGivenUp: string;
  moneyMoved: number;
  confidence: number;
};

export const holdings: Holding[] = [
  {
    symbol: "NVDA",
    tvSymbol: "NASDAQ:NVDA",
    name: "Nvidia",
    colour: "#76b900",
    value: 7900,
    costBasis: 3720,
    account: "Freetrade",
    kind: "share",
    region: "US",
    returnPct: 18.2,
    returnWindow: "3 months",
    flag: { tone: "bad", label: "Too big" },
    note: "Your single largest bet, and four of your funds own it too.",
  },
  {
    symbol: "VWRL",
    tvSymbol: "AMEX:VT",
    name: "World tracker",
    colour: "#1a63ff",
    value: 24500,
    costBasis: 20100,
    account: "Vanguard",
    kind: "fund",
    region: "Global",
    returnPct: 9.4,
    returnWindow: "3 months",
    flag: { tone: "good", label: "Core" },
    note: "Owns a slice of ~3,700 companies. This is the engine of your portfolio.",
  },
  {
    symbol: "VUSA",
    tvSymbol: "AMEX:SPY",
    name: "US 500",
    colour: "#8a63ff",
    value: 16800,
    costBasis: 13900,
    account: "Vanguard",
    kind: "fund",
    region: "US",
    returnPct: 11.1,
    returnWindow: "3 months",
    flag: { tone: "warn", label: "Overlaps" },
    note: "Nine tenths of this already sits inside your world tracker.",
  },
  {
    symbol: "TECH",
    tvSymbol: "NASDAQ:QQQ",
    name: "Tech fund",
    colour: "#17b3c3",
    value: 9400,
    costBasis: 7600,
    account: "Hargreaves",
    kind: "fund",
    region: "US",
    returnPct: 14.6,
    returnWindow: "3 months",
    flag: { tone: "warn", label: "Doubling up" },
    note: "Adds more of what you already own rather than something new.",
  },
  {
    symbol: "AAPL",
    tvSymbol: "NASDAQ:AAPL",
    name: "Apple",
    colour: "#111111",
    value: 5200,
    costBasis: 4300,
    account: "Freetrade",
    kind: "share",
    region: "US",
    returnPct: 6.2,
    returnWindow: "3 months",
  },
  {
    symbol: "ULVR",
    tvSymbol: "LSE:ULVR",
    name: "Unilever",
    colour: "#1f36c7",
    value: 4300,
    costBasis: 4100,
    account: "Hargreaves",
    kind: "share",
    region: "UK",
    returnPct: 1.8,
    returnWindow: "3 months",
    flag: { tone: "good", label: "Steady" },
  },
  {
    symbol: "GILT",
    tvSymbol: "LSE:IGLS",
    name: "Short UK bonds",
    colour: "#565e6e",
    value: 8100,
    costBasis: 8000,
    account: "Vanguard",
    kind: "bond",
    region: "UK",
    returnPct: 1.1,
    returnWindow: "3 months",
    flag: { tone: "good", label: "Shock absorber" },
  },
  {
    symbol: "BOO",
    tvSymbol: "LSE:BOO",
    name: "Boohoo",
    colour: "#ef6fa8",
    value: 620,
    costBasis: 1900,
    account: "Freetrade",
    kind: "share",
    region: "UK",
    returnPct: -21.4,
    returnWindow: "3 months",
    flag: { tone: "bad", label: "Losing money" },
    note: "Has burned cash for three years running.",
  },
  {
    symbol: "CASH",
    tvSymbol: "",
    name: "Cash",
    colour: "#98a0ae",
    value: 4100,
    costBasis: 4100,
    account: "Freetrade",
    kind: "cash",
    region: "UK",
    returnPct: 0,
    returnWindow: "3 months",
    flag: { tone: "warn", label: "Doing nothing" },
    note: "Earning nothing while prices rise.",
  },
];

export const accounts: Account[] = [
  { id: "vg", provider: "Vanguard", label: "Stocks & shares ISA", value: 49400, changePct: 2.4, status: "live", lastSync: "2 minutes ago", counted: true },
  { id: "ft", provider: "Freetrade", label: "General account", value: 17820, changePct: 3.1, status: "live", lastSync: "5 minutes ago", counted: true },
  { id: "hl", provider: "Hargreaves Lansdown", label: "Workplace pension", value: 13700, changePct: 1.2, status: "live", lastSync: "1 hour ago", counted: true },
  { id: "ii", provider: "Interactive Investor", label: "Lifetime ISA", value: 3400, changePct: 0, status: "action", lastSync: "Needs re-login", counted: false },
];

export const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
export const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
export const totalProfit = totalValue - totalCost;

const shareOfPortfolio = (value: number) => Number(((value / totalValue) * 100).toFixed(1));
const valueOf = (symbol: string) => holdings.find((h) => h.symbol === symbol)?.value ?? 0;

/** What the user holds directly in a company, as a share of everything counted. */
export const directExposurePct = (symbol: string) => shareOfPortfolio(valueOf(symbol));

export const weekChange = { amount: 1840, pct: 2.2 };
export const feesPerYear = 412;
export const idleCash = holdings.find((h) => h.symbol === "CASH")?.value ?? 0;

export const scenarios: Scenario[] = [
  { id: "ai", label: "AI spending slows", plainLabel: "Companies stop buying AI chips", impactPct: -12.4, driver: "Nvidia, tech fund, US 500" },
  { id: "gbp", label: "The pound strengthens", plainLabel: "£1 buys more dollars", impactPct: -6.1, driver: "Most of your money is in dollars" },
  { id: "rates", label: "Interest rates rise", plainLabel: "Borrowing gets more expensive", impactPct: -4.2, driver: "Growth shares, long bonds" },
  { id: "oil", label: "Oil falls hard", plainLabel: "Energy gets cheaper", impactPct: -1.1, driver: "Small energy slice" },
  { id: "cuts", label: "Rates get cut", plainLabel: "Borrowing gets cheaper", impactPct: 7.8, driver: "Growth shares, bonds" },
];

/** How much of the portfolio sits in Nvidia through funds rather than the direct holding. */
export const nvidiaHiddenPct = 5.4;

export const badYearLossPct = 31;
export const comfortLimitPct = 20;

export const overlap = {
  pairs: [
    { a: "World tracker", b: "US 500", sharePct: 62 },
    { a: "World tracker", b: "Tech fund", sharePct: 38 },
    { a: "US 500", b: "Tech fund", sharePct: 71 },
  ],
  repeated: [
    { name: "Apple", pct: Number((directExposurePct("AAPL") + 1.4).toFixed(1)), funds: 3 },
    { name: "Nvidia", pct: Number((directExposurePct("NVDA") + nvidiaHiddenPct).toFixed(1)), funds: 4 },
    { name: "Microsoft", pct: 6.3, funds: 3 },
  ],
};

export const recommendations: Recommendation[] = [
  {
    id: "trim-nvda",
    title: "Trim Nvidia back to a normal size",
    plainWhy:
      "Nothing is wrong with the company. One in every ten pounds you own sits in it, and four of your funds quietly own more. A bad month there decides your whole year.",
    symbol: "NVDA",
    tvSymbol: "NASDAQ:NVDA",
    before: directExposurePct("NVDA"),
    after: 5,
    beforeLabel: `${directExposurePct("NVDA")}% of everything`,
    afterLabel: "5% of everything",
    badYearBefore: 31,
    badYearAfter: 24,
    upsideGivenUp: "If Nvidia doubles again you make £2,200 less",
    moneyMoved: 3700,
    confidence: 82,
  },
  {
    id: "swap-fund",
    title: "Swap your US fund for its cheaper twin",
    plainWhy:
      "Same companies, same weights, a third of the cost. Over twenty years the cheaper one leaves roughly £9,400 more in your pocket.",
    symbol: "VUSA",
    tvSymbol: "AMEX:SPY",
    before: 0.22,
    after: 0.07,
    beforeLabel: "£370 a year in fees",
    afterLabel: "£118 a year in fees",
    badYearBefore: 31,
    badYearAfter: 31,
    upsideGivenUp: "Nothing — you own the same companies",
    moneyMoved: 16800,
    confidence: 96,
  },
  {
    id: "stage-cash",
    title: "Put your idle cash to work in four steps",
    plainWhy:
      "£4,100 is earning nothing. Investing it in four monthly chunks means a bad first month costs you a quarter as much as going all in.",
    before: 0,
    after: 4100,
    beforeLabel: "£4,100 sitting still",
    afterLabel: "£1,025 invested a month",
    badYearBefore: 31,
    badYearAfter: 30,
    upsideGivenUp: "Slightly less upside if markets only rise",
    moneyMoved: 4100,
    confidence: 74,
  },
];

export const notDoing = [
  { title: "Selling Apple", why: "It is a sensible size and you pay tax if you sell." },
  { title: "Buying crypto", why: "It would raise your bad-year loss past the line you drew." },
  { title: "Chasing this month's best fund", why: "Last year's winners are usually next year's laggards." },
];

export const opportunities: Opportunity[] = [
  {
    id: "japan",
    tvSymbol: "AMEX:EWJ",
    title: "Japan, without the currency bet",
    subtitle: "You own almost none of the world's third largest market",
    chipTone: "good",
    chip: "Fits your gap",
    reasons: [
      "Moves differently from the US shares you already own",
      "Companies there are paying shareholders more than ever",
      "Costs 0.15% a year",
    ],
    bars: [
      { label: "Fills a gap you have", value: 86, tone: "good" },
      { label: "Moves with what you own", value: 34, tone: "good" },
      { label: "Bumpiness", value: 48, tone: "warn" },
    ],
  },
  {
    id: "shortgilts",
    tvSymbol: "LSE:IGLS",
    title: "Short UK bonds",
    subtitle: "A shock absorber that currently pays you to hold it",
    chipTone: "good",
    chip: "Lowers your bad year",
    reasons: [
      "Cuts your worst-case loss by about 4 percentage points",
      "Pays about 4.3% a year while you wait",
      "Easy to sell if you need the money",
    ],
    bars: [
      { label: "Fills a gap you have", value: 72, tone: "good" },
      { label: "Moves with what you own", value: 12, tone: "good" },
      { label: "Bumpiness", value: 14, tone: "good" },
    ],
  },
  {
    id: "novo",
    tvSymbol: "NYSE:NVO",
    title: "Novo Nordisk",
    subtitle: "Healthcare is your biggest blind spot",
    chipTone: "warn",
    chip: "Single company risk",
    reasons: [
      "You own 1.2% healthcare versus 11% for the world",
      "Profit per £1 of sales is 35p and rising",
      "One product drives most of the growth",
    ],
    bars: [
      { label: "Fills a gap you have", value: 64, tone: "good" },
      { label: "Quality of the business", value: 81, tone: "good" },
      { label: "Bumpiness", value: 66, tone: "warn" },
    ],
  },
];

export type CompanyFacts = {
  symbol: string;
  tvSymbol: string;
  name: string;
  priceLabel: string;
  verdict: string;
  salesGrowthPct: number;
  profitPerPound: number;
  peerProfitPerPound: number;
  priceVsProfits: number;
  marketPriceVsProfits: number;
  customerConcentration: { name: string; pct: number }[];
  mustBeTrue: { claim: string; confidence: number }[];
  exposure: { direct: number; hidden: number };
  vsIndex: { label: string; you: number; index: number }[];
};

export const companies: Record<string, CompanyFacts> = {
  NVDA: {
    symbol: "NVDA",
    tvSymbol: "NASDAQ:NVDA",
    name: "Nvidia",
    priceLabel: "$174.20",
    verdict: "Priced for perfection",
    salesGrowthPct: 62,
    profitPerPound: 56,
    peerProfitPerPound: 10,
    priceVsProfits: 44,
    marketPriceVsProfits: 21,
    customerConcentration: [
      { name: "MSFT", pct: 15 },
      { name: "META", pct: 13 },
      { name: "AMZN", pct: 10 },
      { name: "GOOG", pct: 8 },
    ],
    mustBeTrue: [
      { claim: "AI spending keeps growing 25%+ a year to 2028", confidence: 55 },
      { claim: "No rival takes meaningful share", confidence: 48 },
      { claim: "Margins stay above 50%", confidence: 35 },
    ],
    exposure: { direct: directExposurePct("NVDA"), hidden: nvidiaHiddenPct },
    vsIndex: [
      { label: "Growth", you: 95, index: 42 },
      { label: "Profitability", you: 92, index: 48 },
      { label: "Debt safety", you: 88, index: 55 },
      { label: "Steadiness", you: 26, index: 58 },
      { label: "Value for money", you: 18, index: 52 },
    ],
  },
};

/** Twelve months of portfolio value against a plain world tracker. */
export const valueHistory: { time: string; you: number; tracker: number }[] = (() => {
  const months = [
    "2024-10-01", "2024-11-01", "2024-12-01", "2025-01-01", "2025-02-01", "2025-03-01",
    "2025-04-01", "2025-05-01", "2025-06-01", "2025-07-01", "2025-08-01", "2025-09-01",
  ];
  const you = [68400, 69900, 71200, 70100, 72600, 71800, 74900, 77300, 78100, 80400, 82600, 84320];
  const tracker = [68400, 69400, 70400, 70000, 71500, 71000, 73200, 74900, 75800, 77600, 79600, 82180];
  return months.map((time, i) => ({ time, you: you[i], tracker: tracker[i] }));
})();

export const allocation = [
  { label: "US shares", pct: 46, colour: "#1a63ff" },
  { label: "Rest of world shares", pct: 22, colour: "#8a63ff" },
  { label: "UK shares", pct: 12, colour: "#17b3c3" },
  { label: "Bonds", pct: 11, colour: "#0aa06e" },
  { label: "Cash", pct: 5, colour: "#98a0ae" },
  { label: "Other", pct: 4, colour: "#ef6fa8" },
];

export const weekMovers = [
  { label: "Nvidia", amount: 940 },
  { label: "US 500", amount: 520 },
  { label: "World tracker", amount: 410 },
  { label: "Boohoo", amount: -180 },
  { label: "Unilever", amount: 150 },
];

export const money = (n: number) =>
  `${n < 0 ? "−" : ""}£${Math.abs(Math.round(n)).toLocaleString("en-GB")}`;

export const pct = (n: number, digits = 1) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const allocationOf = (h: Holding) => (h.value / totalValue) * 100;

/** Everything the assistant is allowed to read about the user, in one shape. */
export function portfolioSnapshot() {
  return {
    totalValue,
    totalProfit,
    weekChange,
    feesPerYear,
    idleCash,
    badYearLossPct,
    comfortLimitPct,
    holdings: holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      value: h.value,
      allocationPct: Number(allocationOf(h).toFixed(1)),
      returnPct: h.returnPct,
      account: h.account,
      kind: h.kind,
      region: h.region,
      flag: h.flag?.label,
      note: h.note,
    })),
    accounts: accounts.map((a) => ({
      provider: a.provider,
      label: a.label,
      value: a.value,
      status: a.status,
      countedInTotal: a.counted,
    })),
  };
}
