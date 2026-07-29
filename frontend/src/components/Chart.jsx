import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../api.js";

const POLL_MS = 1500;

export default function Chart({ symbol, timeframe }) {
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

  // Load history immediately on symbol/timeframe change, then poll for updates.
  useEffect(() => {
    let cancelled = false;
    let first = true;

    async function refresh() {
      try {
        const candles = await api.getCandles(symbol, timeframe, 300);
        if (cancelled || !seriesRef.current) return;
        seriesRef.current.setData(candles);
        if (first) {
          chartRef.current.timeScale().fitContent();
          first = false;
        }
      } catch (e) {
        console.error("candle refresh failed", e);
      }
    }

    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, timeframe]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
