# Northstar

A robo-adviser that shows what you own, what it reacts to, and what to do about it — in plain English.

Next.js App Router, TradingView widgets and lightweight-charts for market visuals, Vercel AI SDK for the
assistant.

## Running it

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY for the chat
npm run dev
```

Portfolio data in `src/lib/portfolio.ts` is illustrative mock data, not a real connected account.
