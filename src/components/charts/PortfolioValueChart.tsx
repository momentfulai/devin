"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";

export type ValuePoint = { time: string; you: number; tracker: number };

/**
 * Portfolio value over time drawn with TradingView's lightweight-charts, with a
 * dashed line showing what a plain world tracker would have done instead.
 */
export function PortfolioValueChart({
  data,
  height = 260,
  months,
}: {
  data: ValuePoint[];
  height?: number;
  months: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const instance = createChart(node, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#98a0ae",
        fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Roboto, sans-serif",
        attributionLogo: false,
      },
      grid: {
        horzLines: { color: "#f1f2f6" },
        vertLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      crosshair: { horzLine: { labelBackgroundColor: "#0a0c11" }, vertLine: { labelBackgroundColor: "#0a0c11" } },
      handleScale: false,
      handleScroll: false,
    });

    const you = instance.addSeries(AreaSeries, {
      lineColor: "#1a63ff",
      lineWidth: 2,
      topColor: "rgba(26,99,255,0.22)",
      bottomColor: "rgba(26,99,255,0)",
      priceLineVisible: false,
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    });
    const tracker = instance.addSeries(LineSeries, {
      color: "#c6cbd6",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    });

    const slice = data.slice(Math.max(0, data.length - months));
    you.setData(slice.map((p) => ({ time: p.time as Time, value: p.you })));
    tracker.setData(slice.map((p) => ({ time: p.time as Time, value: p.tracker })));
    instance.timeScale().fitContent();
    chart.current = instance;

    const resize = () => instance.applyOptions({ width: node.clientWidth });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    return () => {
      observer.disconnect();
      instance.remove();
      chart.current = null;
    };
  }, [data, height, months]);

  return <div ref={host} style={{ width: "100%", height }} />;
}
