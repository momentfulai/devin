"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Widget script name, e.g. "advanced-chart" or "mini-symbol-overview". */
  widget: string;
  config: Record<string, unknown>;
  height: number;
  className?: string;
};

/**
 * Embeds a TradingView widget. The widget scripts read their settings from the
 * text content of the script tag, so the whole container is rebuilt whenever the
 * config changes.
 */
export function TradingViewWidget({ widget, config, height, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const serialised = JSON.stringify(config);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    node.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    container.style.height = `${height}px`;
    node.appendChild(container);

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = serialised;
    node.appendChild(script);

    return () => {
      node.innerHTML = "";
    };
  }, [widget, serialised, height]);

  return (
    <div
      ref={host}
      className={`tradingview-widget-container tv-frame ${className ?? ""}`}
      style={{ height }}
    />
  );
}
