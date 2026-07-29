import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../api.js";

export default function Chart({ symbol, timeframe, liveCandle }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Create chart once
  useEffect(() => {
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#7c8794",
        fontFamily: "IBM Plex Mono, monospace"
      },
      grid: {
        vertLines: { color: "#1e2731" },
        horzLines: { color: "#1e2731" }
      },
      timeScale: { timeVisible: true, secondsVisible: true, borderColor: "#1e2731" },
      rightPriceScale: { borderColor: "#1e2731" },
      crosshair: { mode: 0 },
      autoSize: true
    });

    const series = chart.addCandlestickSeries({
      upColor: "#2dd4bf",
      downColor: "#fb5d5d",
      borderVisible: false,
      wickUpColor: "#2dd4bf",
      wickDownColor: "#fb5d5d"
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => chart.remove();
  }, []);

  // Load history whenever symbol/timeframe changes
  useEffect(() => {
    let cancelled = false;
    api.getCandles(symbol, timeframe, 300).then((candles) => {
      if (cancelled || !seriesRef.current) return;
      seriesRef.current.setData(candles);
      chartRef.current.timeScale().fitContent();
    });
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  // Apply live updates as they stream in
  useEffect(() => {
    if (!liveCandle || !seriesRef.current) return;
    seriesRef.current.update(liveCandle);
  }, [liveCandle]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
