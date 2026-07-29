import React, { useEffect, useRef, useState } from "react";

function LiveTicker() {
  // Small decorative animated price line — reads as "this is a live trading engine" without hitting the real API
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let points = Array.from({ length: 80 }, () => 50 + Math.random() * 10);

    function draw() {
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);

      points.shift();
      const last = points[points.length - 1];
      points.push(Math.max(20, Math.min(80, last + (Math.random() - 0.48) * 6)));

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#f0b429";
      points.forEach((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - (p / 100) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(240,180,41,0.25)");
      grad.addColorStop(1, "rgba(240,180,41,0)");
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      raf = requestAnimationFrame(() => setTimeout(draw, 90));
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="ticker-canvas" />;
}

const FEATURES = [
  {
    tag: "01",
    title: "Synthetic OTC pairs",
    body: "Trade round the clock, even when real markets are closed. Every OTC instrument runs on a configurable price model — not a frozen weekend chart."
  },
  {
    tag: "02",
    title: "Ten timeframes, one chart",
    body: "Drop from H4 down to a 5-second candle without losing your place. Built for fast, short-expiry decisions."
  },
  {
    tag: "03",
    title: "Admin-tunable engine",
    body: "Volatility, trend, mean reversion, spread, payout — every OTC pair's behavior is a live dial, not a deploy."
  },
  {
    tag: "04",
    title: "Zero-risk demo account",
    body: "Full trading loop, virtual balance, real expiry countdowns. Reset anytime, learn the mechanics before anything real is on the line."
  }
];

export default function LandingPage({ onLaunch }) {
  const [year] = useState(new Date().getFullYear());

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">
          <span className="dot" />
          Volt OTC
        </div>
        <button className="nav-cta" onClick={onLaunch}>Launch Demo →</button>
      </nav>

      <header className="hero">
        <div className="hero-text">
          <div className="eyebrow">Demo trading engine</div>
          <h1>
            Practice OTC trading
            <br />
            on a market that <span className="accent">never sleeps.</span>
          </h1>
          <p>
            Volt OTC is a demo binary-style trading platform: synthetic OTC pairs, live
            candlestick charts across ten timeframes, and an admin panel that controls
            exactly how each instrument moves. No real money, no real risk — just the
            mechanics.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onLaunch}>Open the demo platform</button>
            <a className="btn-ghost" href="#features">See how it works</a>
          </div>
        </div>
        <div className="hero-chart">
          <LiveTicker />
          <div className="hero-chart-label">
            <span className="sym">EUR/USD OTC</span>
            <span className="tag">simulated feed</span>
          </div>
        </div>
      </header>

      <section id="features" className="features">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.tag}>
            <div className="feature-tag">{f.tag}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="cta-band">
        <h2>Everything runs live. Nothing is at stake.</h2>
        <button className="btn-primary" onClick={onLaunch}>Enter demo platform</button>
      </section>

      <footer className="landing-footer">
        <span>© {year} Volt OTC — demo platform, not a real broker.</span>
        <span>Binary-style OTC products are restricted or banned for retail traders in many jurisdictions. This is a practice environment only.</span>
      </footer>
    </div>
  );
}
