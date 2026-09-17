import { createGateway } from "@ai-sdk/gateway";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import {
  allocation,
  badYearLossPct,
  comfortLimitPct,
  companies,
  feesPerYear,
  holdings,
  money,
  notDoing,
  opportunities,
  overlap,
  portfolioSnapshot,
  recommendations,
  scenarios,
} from "@/lib/portfolio";
import {
  defaultKnobs,
  presetKnobs,
  presets,
  project,
  projectCombo,
  simulate,
  simulateCombo,
  strategies,
  strategySnapshot,
} from "@/lib/strategies";

export const maxDuration = 30;

const gateway = createGateway({
  apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
  ...(process.env.VERCEL_AI_GATEWAY_BASE_URL ? { baseURL: process.env.VERCEL_AI_GATEWAY_BASE_URL } : {}),
});
const chatModel = process.env.CHAT_MODEL ?? "openai/gpt-4o-mini";

const maxMessages = 40;
const maxCharacters = 20000;

const textLength = (message: UIMessage) =>
  message.parts.reduce((sum, part) => sum + (part.type === "text" ? part.text.length : 0), 0);

const windowMs = 60_000;
const maxRequestsPerWindow = 20;
const hits = new Map<string, number[]>();

function overRateLimit(req: Request) {
  const caller = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(caller) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(caller, recent);
  return recent.length > maxRequestsPerWindow;
}

const system = `You are Northstar, a calm financial guide for someone with no investing background.

How you talk:
- Plain English only. Never use jargon such as beta, alpha, Sharpe, drawdown, duration, valuation multiple, or diversification. Say what those things mean instead.
- Put every number in pounds first, percentages second, and always say what it means for the person.
- Two to four short sentences. No bullet lists longer than three items. No markdown headings.
- Never invent a number. Call a tool and use what it returns. If a tool cannot answer, say so plainly.
- You explain the adviser's reasoning; you do not place trades and you never promise a return.
- When something is a judgement call, say what would have to be true for it to be wrong.
- Strategies run in practice mode: you can show what one would have done and what it would trade, but nothing reaches a real account until the person switches it on themselves.`;

/** Screens the person can be looking at, so "explain this" and "why this number" land on the right thing. */
const screens: Record<string, string> = {
  "/": "Today: total value, this week's move, a 1-year value chart against a plain world tracker, the mix of what they own, and every holding with its size.",
  "/risk": "What's at risk: the bad-year loss estimate against their comfort limit, what their money reacts to, scenario falls in pounds, and companies they own twice through different funds.",
  "/actions": "What to do: the adviser's suggested trades, each with the reason, the before and after, and what happens if they ignore it.",
  "/ideas": "Ideas: gaps in what they own and the investments that would fill them, with what would have to be true for each to work.",
  "/strategies": "Strategies: ready-made sets they can switch on with one tap, four rules they can switch on or off and combine, sliders to tune each one, a preview of what each would have done to their own money versus doing nothing, the trades it would place, and how their portfolio would look afterwards. Practice mode only.",
  "/accounts": "Accounts: the connected providers, when each last synced, and the one that needs a re-login and is therefore left out of the totals.",
};

/** A small always-on snapshot so the assistant knows the person before it calls a single tool. */
function appContext(page: string | undefined) {
  const snapshot = portfolioSnapshot();
  const looking = page && screens[page] ? `\nThey are looking at ${screens[page]}` : "";
  return `Who you are talking to, right now:
- Total ${money(snapshot.totalValue)} across ${snapshot.accounts.filter((a) => a.countedInTotal).length} connected accounts, ${money(snapshot.idleCash)} sitting in cash, ${money(snapshot.feesPerYear)} a year in fees.
- Biggest positions: ${[...snapshot.holdings].sort((a, b) => b.value - a.value).slice(0, 4).map((h) => `${h.name} ${money(h.value)} (${h.allocationPct}%)`).join(", ")}.
- A bad year is estimated at −${badYearLossPct}% against the −${comfortLimitPct}% they said they could live with.
- Strategies they can try: ${strategies.map((s) => `${s.name} (${s.id})`).join(", ")}, on their own or combined.
- Ready-made sets: ${presets.map((p) => `${p.name} (${p.id})`).join(", ")}.${looking}
Use the tools for anything more precise than this.`;
}

export async function POST(req: Request) {
  if (overRateLimit(req)) {
    return Response.json({ error: "Too many questions at once. Try again in a minute." }, { status: 429 });
  }

  const { messages, page }: { messages: UIMessage[]; page?: string } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages sent." }, { status: 400 });
  }
  if (messages.length > maxMessages) {
    return Response.json({ error: "This conversation is too long. Start a new one." }, { status: 413 });
  }
  if (messages.reduce((sum, m) => sum + textLength(m), 0) > maxCharacters) {
    return Response.json({ error: "That message is too long." }, { status: 413 });
  }

  const result = streamText({
    model: gateway(chatModel),
    system: `${system}\n\n${appContext(page)}`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      getPortfolio: tool({
        description:
          "The whole picture: total value, profit, fees, idle cash, every holding with its size, and the connected accounts.",
        inputSchema: z.object({}),
        execute: async () => portfolioSnapshot(),
      }),
      getHolding: tool({
        description: "Detail on one holding the user owns, by ticker or name.",
        inputSchema: z.object({ query: z.string().describe("Ticker or company name, e.g. NVDA or Nvidia") }),
        execute: async ({ query }) => {
          const q = query.toLowerCase();
          const match = holdings.find(
            (h) => h.symbol.toLowerCase() === q || h.name.toLowerCase().includes(q),
          );
          if (!match) return { found: false, owned: holdings.map((h) => h.symbol) };
          return { found: true, holding: match, company: companies[match.symbol] ?? null };
        },
      }),
      getRisk: tool({
        description:
          "What the portfolio reacts to: bad-year loss estimate, the comfort limit the user set, scenario impacts, and where the same companies are owned twice.",
        inputSchema: z.object({}),
        execute: async () => ({
          badYearLossPct,
          comfortLimitPct,
          overComfortBy: badYearLossPct - comfortLimitPct,
          scenarios,
          overlap,
          allocation,
        }),
      }),
      getRecommendations: tool({
        description:
          "The trades the adviser suggests, with the before and after numbers, plus the things it deliberately is not suggesting.",
        inputSchema: z.object({}),
        execute: async () => ({ recommendations, notDoing, feesPerYear }),
      }),
      explainRecommendation: tool({
        description: "Why one specific suggestion was made, including what the user gives up by taking it.",
        inputSchema: z.object({ id: z.string().describe("Recommendation id, e.g. trim-nvda") }),
        execute: async ({ id }) => {
          const match = recommendations.find((r) => r.id === id);
          return match ?? { found: false, available: recommendations.map((r) => r.id) };
        },
      }),
      getOpportunities: tool({
        description: "Ideas that would fill a gap in the portfolio, and why each one fits or does not.",
        inputSchema: z.object({}),
        execute: async () => opportunities,
      }),
      getStrategies: tool({
        description:
          "The strategies the user can try, what each one would have done to their own money on default settings, and the trades it would place.",
        inputSchema: z.object({}),
        execute: async () => strategySnapshot(),
      }),
      testStrategy: tool({
        description:
          "Run one strategy with specific settings and return what it would have done over the last year versus doing nothing.",
        inputSchema: z.object({
          id: z.string().describe("Strategy id, e.g. trim-winners, drip, buy-dip, safety-net"),
          settings: z
            .record(z.string(), z.number())
            .optional()
            .describe("Override the strategy's sliders, e.g. { limit: 8 }"),
        }),
        execute: async ({ id, settings }) => {
          const match = strategies.find((s) => s.id === id);
          if (!match) return { found: false, available: strategies.map((s) => s.id) };
          const applied = { ...defaultKnobs(match), ...settings };
          const projection = project(match.id, applied);
          return {
            found: true,
            name: match.name,
            settings: applied,
            result: simulate(match.id, applied),
            portfolioAfter: {
              biggestCompany: projection.biggestCompany,
              badYear: projection.badYear,
              cash: projection.cash,
              feesPerYear: projection.feesPerYear,
              mixAfter: projection.mixAfter,
              changes: projection.changes,
            },
          };
        },
      }),
      getPresets: tool({
        description:
          "Ready-made sets of strategies the user can switch on with one tap, and who each set is for.",
        inputSchema: z.object({}),
        execute: async () =>
          presets.map((p) => ({
            id: p.id,
            name: p.name,
            oneLiner: p.oneLiner,
            forWhom: p.forWhom,
            rules: p.strategyIds.map((id) => strategies.find((s) => s.id === id)?.name ?? id),
            settings: presetKnobs(p),
          })),
      }),
      testPlan: tool({
        description:
          "Run several strategies together — or a ready-made set — and return what the combination would have done over the last year, plus the portfolio it leaves behind.",
        inputSchema: z.object({
          presetId: z.string().optional().describe("A ready-made set, e.g. calm, habit, tidy, everything"),
          ids: z.array(z.string()).optional().describe("Strategy ids to run together, e.g. [\"drip\", \"buy-dip\"]"),
        }),
        execute: async ({ presetId, ids }) => {
          const preset = presetId ? presets.find((p) => p.id === presetId) : undefined;
          if (presetId && !preset) return { found: false, available: presets.map((p) => p.id) };
          const chosen = preset ? preset.strategyIds : (ids ?? []);
          const unknown = chosen.filter((id) => !strategies.some((s) => s.id === id));
          if (chosen.length === 0 || unknown.length > 0) {
            return { found: false, unknown, available: strategies.map((s) => s.id) };
          }
          const settings = preset
            ? presetKnobs(preset)
            : Object.fromEntries(
                strategies.filter((s) => chosen.includes(s.id)).map((s) => [s.id, defaultKnobs(s)]),
              );
          const projection = projectCombo(chosen, settings);
          return {
            found: true,
            name: preset?.name ?? "Your own combination",
            rules: chosen,
            settings,
            result: simulateCombo(chosen, settings),
            portfolioAfter: {
              biggestCompany: projection.biggestCompany,
              badYear: projection.badYear,
              cash: projection.cash,
              feesPerYear: projection.feesPerYear,
              mixAfter: projection.mixAfter,
              changes: projection.changes,
            },
          };
        },
      }),
      whatIf: tool({
        description:
          "Estimate the pound impact of a market fall on the whole portfolio or on one holding.",
        inputSchema: z.object({
          fallPct: z.number().describe("Size of the fall as a positive percentage, e.g. 30"),
          symbol: z.string().optional().describe("Limit the fall to one holding, e.g. NVDA"),
        }),
        execute: async ({ fallPct, symbol }) => {
          const scope = symbol
            ? holdings.filter((h) => h.symbol.toLowerCase() === symbol.toLowerCase())
            : holdings.filter((h) => h.kind !== "cash");
          if (symbol && scope.length === 0) {
            return { found: false, symbol, owned: holdings.map((h) => h.symbol) };
          }
          const exposed = scope.reduce((sum, h) => sum + h.value, 0);
          const loss = Math.round((exposed * fallPct) / 100);
          return {
            fallPct,
            scope: symbol ?? "everything except cash",
            exposedValue: exposed,
            lossInPounds: loss,
            monthsOfSaving: Math.round(loss / 620),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
