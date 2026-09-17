"use client";

type Props = {
  /** Widget name, e.g. "advanced-chart" or "mini-symbol-overview". */
  widget: string;
  config: Record<string, unknown>;
  height: number;
  className?: string;
};

/**
 * Embeds a TradingView widget as the iframe their loader script would build.
 * Going straight to the iframe keeps the widget under React's control, so a
 * theme change simply swaps the src instead of tearing down an async script.
 */
export function TradingViewWidget({ widget, config, height, className }: Props) {
  const settings = encodeURIComponent(JSON.stringify({ ...config, width: "100%", height }));
  const query = new URLSearchParams({ locale: "en" });
  // Some widgets (symbol-info) read the symbol from the query and ignore the hash.
  if (typeof config.symbol === "string") query.set("symbol", config.symbol);
  const src = `https://www.tradingview-widget.com/embed-widget/${widget}/?${query}#${settings}`;

  return (
    <div className={`tradingview-widget-container tv-frame ${className ?? ""}`} style={{ height }}>
      <iframe
        key={src}
        src={src}
        title={`${widget} chart`}
        scrolling="no"
        style={{ display: "block", width: "100%", height, border: 0 }}
      />
    </div>
  );
}
