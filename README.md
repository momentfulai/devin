# Northstar

A robo-adviser that shows what you own, what it reacts to, and what to do about it — in plain English.

Next.js App Router, TradingView widgets and lightweight-charts for market visuals, Vercel AI SDK for the
assistant.

## Running it

```bash
./run.sh
```

It creates `.env.local` from `.env.example` on the first run — add your `OPENAI_API_KEY` there for the
chat, then re-run. Everything except the chat works without a key. Equivalent manual steps:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Portfolio data in `src/lib/portfolio.ts` is illustrative mock data, not a real connected account.
