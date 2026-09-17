import { openai } from "@ai-sdk/openai";
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

export const maxDuration = 30;

const system = `You are Northstar, a calm financial guide for someone with no investing background.

How you talk:
- Plain English only. Never use jargon such as beta, alpha, Sharpe, drawdown, duration, valuation multiple, or diversification. Say what those things mean instead.
- Put every number in pounds first, percentages second, and always say what it means for the person.
- Two to four short sentences. No bullet lists longer than three items. No markdown headings.
- Never invent a number. Call a tool and use what it returns. If a tool cannot answer, say so plainly.
- You explain the adviser's reasoning; you do not place trades and you never promise a return.
- When something is a judgement call, say what would have to be true for it to be wrong.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
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
