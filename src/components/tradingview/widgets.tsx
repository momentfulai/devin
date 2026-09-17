"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useTheme } from "../theme";

const chartFont = "-apple-system, BlinkMacSystemFont, Inter, Roboto, sans-serif";

/** Small keyless price line — used wherever the mockup had a hand-drawn sparkline. */
export function MiniChart({
  symbol,
  range = "12M",
  height = 120,
}: {
  symbol: string;
  range?: "1D" | "1M" | "3M" | "12M" | "60M" | "ALL";
  height?: number;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <TradingViewWidget
      widget="mini-symbol-overview"
      height={height}
      config={{
        symbol,
        width: "100%",
        height,
        locale: "en",
        dateRange: range,
        colorTheme: theme,
        isTransparent: false,
        autosize: false,
        largeChartUrl: "",
        chartOnly: true,
        noTimeScale: true,
        trendLineColor: dark ? "#5b8cff" : "#1a63ff",
        underLineColor: dark ? "rgba(91,140,255,0.22)" : "rgba(26,99,255,0.16)",
        underLineBottomColor: "rgba(26,99,255,0)",
        fontFamily: chartFont,
      }}
    />
  );
}

/** Full interactive price chart for a single company. */
export function AdvancedChart({
  symbol,
  height = 420,
  interval = "D",
}: {
  symbol: string;
  height?: number;
  interval?: string;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <TradingViewWidget
      widget="advanced-chart"
      height={height}
      config={{
        symbol,
        interval,
        height,
        width: "100%",
        autosize: false,
        timezone: "Europe/London",
        theme,
        style: "3",
        locale: "en",
        hide_side_toolbar: true,
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
        save_image: false,
        withdateranges: true,
        backgroundColor: dark ? "#141821" : "#ffffff",
        gridColor: dark ? "rgba(36,42,55,0.8)" : "rgba(233,235,240,0.8)",
        support_host: "https://www.tradingview.com",
      }}
    />
  );
}

/** Several symbols on one chart — used to compare a holding with what it tracks. */
export function SymbolOverview({
  symbols,
  height = 300,
}: {
  symbols: [string, string][];
  height?: number;
}) {
  const { theme } = useTheme();

  return (
    <TradingViewWidget
      widget="symbol-overview"
      height={height}
      config={{
        symbols,
        chartOnly: false,
        width: "100%",
        height,
        locale: "en",
        colorTheme: theme,
        isTransparent: false,
        autosize: false,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        scalePosition: "right",
        scaleMode: "Percentage",
        fontFamily: chartFont,
        lineWidth: 2,
        lineType: 0,
        dateRanges: ["1m|30", "3m|60", "12m|1D", "60m|1W"],
      }}
    />
  );
}

/** Headline facts about a company, straight from TradingView. */
export function SymbolInfo({ symbol, height = 180 }: { symbol: string; height?: number }) {
  const { theme } = useTheme();

  return (
    <TradingViewWidget
      widget="symbol-info"
      height={height}
      config={{
        symbol,
        width: "100%",
        locale: "en",
        colorTheme: theme,
        isTransparent: false,
      }}
    />
  );
}

/** The "what is the market mood" dial. */
export function TechnicalGauge({ symbol, height = 400 }: { symbol: string; height?: number }) {
  const { theme } = useTheme();

  return (
    <TradingViewWidget
      widget="technical-analysis"
      height={height}
      config={{
        symbol,
        interval: "1D",
        width: "100%",
        height,
        isTransparent: false,
        showIntervalTabs: false,
        displayMode: "single",
        locale: "en",
        colorTheme: theme,
      }}
    />
  );
}

/** Company fundamentals table. */
export function Fundamentals({ symbol, height = 490 }: { symbol: string; height?: number }) {
  const { theme } = useTheme();

  return (
    <TradingViewWidget
      widget="financials"
      height={height}
      config={{
        symbol,
        colorTheme: theme,
        displayMode: "compact",
        isTransparent: false,
        width: "100%",
        height,
        locale: "en",
        largeChartUrl: "",
      }}
    />
  );
}

/** Scrolling ribbon of the markets the user actually owns. */
export function Ticker({ symbols }: { symbols: { proName: string; title: string }[] }) {
  const { theme } = useTheme();

  return (
    <TradingViewWidget
      widget="ticker-tape"
      height={46}
      config={{
        symbols,
        showSymbolLogo: true,
        isTransparent: false,
        displayMode: "adaptive",
        colorTheme: theme,
        locale: "en",
      }}
    />
  );
}
