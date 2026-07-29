import React, { useEffect, useState } from "react";
import LandingPage from "./LandingPage.jsx";
import TradingApp from "./TradingApp.jsx";

function getView() {
  return window.location.hash === "#/app" ? "app" : "landing";
}

export default function App() {
  const [view, setView] = useState(getView());

  useEffect(() => {
    const onHashChange = () => setView(getView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (view === "app") return <TradingApp />;
  return <LandingPage onLaunch={() => { window.location.hash = "#/app"; }} />;
}
