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
  notDoing,
  opportunities,
  overlap,
  portfolioSnapshot,
  recommendations,
  scenarios,
} from "@/lib/portfolio";
import { defaultKnobs, simulate, strategies, strategySnapshot } from "@/lib/strategies";

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

export async function POST(req: Request) {
  if (overRateLimit(req)) {
    return Response.json({ error: "Too many questions at once. Try again in a minute." }, { status: 429 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

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
    system,
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
          return {
            found: true,
            name: match.name,
            settings: { ...defaultKnobs(match), ...settings },
            result: simulate(match.id, { ...defaultKnobs(match), ...settings }),
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
