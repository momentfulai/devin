import { badYearLossPct, idleCash, totalValue } from "./portfolio";

/**
 * A surface-level look at the future: thousands of made-up years played out on
 * the portfolio, summarised as good / average / bad. Nothing here is a forecast,
 * and the maths never reaches the screen — only what it would mean in pounds.
 */

export type Band = {
  year: number;
  bad: number;
  poor: number;
  average: number;
  good: number;
  great: number;
};

export type Future = {
  startValue: number;
  monthlyContribution: number;
  years: number;
  paidIn: number;
  bands: Band[];
  /** One in ten years are worse than this. */
  bad: number;
  average: number;
  /** One in ten years are better than this. */
  good: number;
  chanceOfMoreThanPaidIn: number;
  chanceOfDoubling: number;
  typicalWorstDipPct: number;
  /** A handful of individual runs, so the fan does not look like a guarantee. */
  samplePaths: number[][];
};

/** Deterministic noise: the same inputs always draw the same fan, so nothing jitters. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(next: () => number) {
  const u = Math.max(next(), 1e-9);
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))];

export function projectFuture({
  startValue = totalValue,
  monthlyContribution = 0,
  years = 20,
  badYearPct = badYearLossPct,
  growthPct = 6.5,
  runs = 1200,
  seed = 20240517,
}: {
  startValue?: number;
  monthlyContribution?: number;
  years?: number;
  /** What a bad year would cost today — stands in for how bumpy the portfolio is. */
  badYearPct?: number;
  growthPct?: number;
  runs?: number;
  seed?: number;
} = {}): Future {
  const months = Math.round(years * 12);
  // A bad year is roughly 1.65 standard deviations below average, so this reads
  // the portfolio's own risk number back out as month-to-month bumpiness.
  const annualVol = Math.max(0.04, (badYearPct + growthPct) / 100 / 1.65);
  const monthlyVol = annualVol / Math.sqrt(12);
  const monthlyDrift = Math.log(1 + growthPct / 100) / 12 - (monthlyVol * monthlyVol) / 2;

  const next = rng(seed);
  const endings: number[] = [];
  const dips: number[] = [];
  const byYear: number[][] = Array.from({ length: years + 1 }, () => []);
  const samplePaths: number[][] = [];

  for (let run = 0; run < runs; run += 1) {
    let value = startValue;
    let peak = startValue;
    let worstDip = 0;
    const yearly = [startValue];
    byYear[0].push(startValue);

    for (let m = 1; m <= months; m += 1) {
      value = value * Math.exp(monthlyDrift + monthlyVol * normal(next)) + monthlyContribution;
      peak = Math.max(peak, value);
      worstDip = Math.max(worstDip, (peak - value) / peak);
      if (m % 12 === 0) {
        yearly.push(value);
        byYear[m / 12].push(value);
      }
    }

    endings.push(value);
    dips.push(worstDip);
    if (run < 6) samplePaths.push(yearly.map((v) => Math.round(v)));
  }

  const sortedEndings = [...endings].sort((a, b) => a - b);
  const paidIn = startValue + monthlyContribution * months;
  const sortedDips = [...dips].sort((a, b) => a - b);

  const bands = byYear.map((values, year) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      year,
      bad: Math.round(percentile(sorted, 0.1)),
      poor: Math.round(percentile(sorted, 0.25)),
      average: Math.round(percentile(sorted, 0.5)),
      good: Math.round(percentile(sorted, 0.75)),
      great: Math.round(percentile(sorted, 0.9)),
    };
  });

  return {
    startValue: Math.round(startValue),
    monthlyContribution,
    years,
    paidIn: Math.round(paidIn),
    bands,
    bad: Math.round(percentile(sortedEndings, 0.1)),
    average: Math.round(percentile(sortedEndings, 0.5)),
    good: Math.round(percentile(sortedEndings, 0.9)),
    chanceOfMoreThanPaidIn: Math.round((endings.filter((v) => v > paidIn).length / runs) * 100),
    chanceOfDoubling: Math.round((endings.filter((v) => v >= paidIn * 2).length / runs) * 100),
    typicalWorstDipPct: Math.round(percentile(sortedDips, 0.5) * 100),
    samplePaths,
  };
}

/** The same picture in words, for the assistant and for anyone who skips charts. */
export function futureInWords(future: Future) {
  return {
    inYears: future.years,
    youWouldHavePaidIn: future.paidIn,
    badCase: future.bad,
    averageCase: future.average,
    goodCase: future.good,
    chanceOfEndingAheadPct: future.chanceOfMoreThanPaidIn,
    chanceOfDoublingPct: future.chanceOfDoubling,
    typicalWorstDipPct: future.typicalWorstDipPct,
    idleCashToday: idleCash,
    caveat:
      "Thousands of made-up futures based on how bumpy this portfolio is today. Not a forecast, and real markets can do worse than the worst line here.",
  };
}
